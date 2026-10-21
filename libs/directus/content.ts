import 'server-only'

import { readItems } from '@directus/sdk'
import { unstable_cache } from 'next/cache'
import { logger } from '@libs/logger'
import { getDirectusClient } from './client'
import type { ContentNamespace, ContentResult, ContentRow, Language } from './definitions'

/**
 * Reads the `web_contents` collection — the shared CMS copy deck used across Pi web apps.
 *
 * Content changes on the editors' schedule, not the request's, so hitting Directus once an hour is
 * plenty. The tag lets a Directus webhook expire it and push an edit through immediately — which is
 * where this belongs in a real app, called from a route handler on publish.
 */
export const DIRECTUS_CACHE_TAG = 'directus-content'

export type { ContentNamespace, ContentResult, ContentRow, Language } from './definitions'

/**
 * The SDK equivalent of the query the other Pi apps use:
 *
 *   GET {directus-host}/items/web_contents
 *     ?fields=id,namespace,translations.value
 *     &deep[translations][_filter][languages_code][code][_starts_with]=th
 *     &deep[translations][_filter][value][_nnull]=true
 *     &filter[namespace][_in]=20
 *     &limit=-1
 *
 * Three details that are easy to get wrong:
 *
 * - `deep` filters the *nested* translations, not the rows. A plain `filter` on
 *   `translations.languages_code` would instead drop whole content rows, so a row translated into
 *   English only would vanish from the Thai response rather than come back untranslated.
 * - `_starts_with` and not `_eq`: the language codes are locales (`th-TH`, `en-US`), so matching
 *   `th` exactly returns nothing.
 * - `limit: -1` means no limit. Directus otherwise caps the response at 100 rows, silently.
 *
 * `pi-web-v2` additionally filters `status = published`; this query mirrors the shared Bruno
 * request, which does not. Add it if your collection uses the status workflow.
 */
async function fetchWebContents(language: Language, namespaces: ContentNamespace[]): Promise<ContentRow[]> {
    const rows = await getDirectusClient().request(
        readItems('web_contents', {
            fields: ['id', 'namespace', { translations: ['value'] }],
            filter: { namespace: { _in: namespaces } },
            deep: {
                translations: {
                    _filter: {
                        languages_code: { code: { _starts_with: language } },
                        value: { _nnull: true }
                    }
                }
            },
            limit: -1
        })
    )

    // The deep filter can leave `translations` null rather than empty, so it is normalised here
    // instead of forcing every caller to handle both.
    return rows.map(row => ({
        id: row.id,
        namespace: row.namespace,
        translations: row.translations ?? []
    }))
}

/**
 * Deliberately allowed to throw: `unstable_cache` does not store a rejected promise, so a transient
 * CMS outage is retried on the next request. Catching *inside* the cached function would store the
 * empty fallback under the cache key and keep serving it for the full hour.
 *
 * The arguments are part of the cache key, so each language/namespace combination caches separately.
 */
const getCachedWebContents = unstable_cache(fetchWebContents, [DIRECTUS_CACHE_TAG], {
    revalidate: 3600,
    tags: [DIRECTUS_CACHE_TAG]
})

/**
 * Never rejects. A CMS outage should degrade the page, not take it down — a screen with no copy
 * still works — so the failure comes back as `degraded` for callers that want to say so.
 */
export async function getWebContents(language: Language, namespaces: ContentNamespace[]): Promise<ContentResult> {
    try {
        return { items: await getCachedWebContents(language, namespaces), degraded: false }
    } catch (error) {
        logger.error('Directus: content fetch failed, falling back to an empty list', {
            language,
            namespaces,
            error
        })
        return { items: [], degraded: true }
    }
}

/**
 * Flattens the rows into the `{ contentId: text }` map a page actually renders from.
 *
 * A row with no translation in the requested language collapses to an empty string rather than
 * being dropped, so a lookup never returns `undefined` and a missing translation shows as a blank
 * instead of the literal word "undefined".
 */
export async function getTranslations(
    language: Language,
    namespaces: ContentNamespace[]
): Promise<Record<number, string>> {
    const { items } = await getWebContents(language, namespaces)
    return Object.fromEntries(items.map(item => [item.id, item.translations[0]?.value ?? '']))
}
