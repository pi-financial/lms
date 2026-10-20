'use server'

import { updateTag } from 'next/cache'
import { DIRECTUS_CACHE_TAG, getWebContents, type ContentResult } from '@libs/directus/content'
import { logger } from '@libs/logger'
import { resolveLocale } from '@libs/preferences/definitions'
import { parseNamespaces } from './params'

/**
 * Server Actions for the Directus demo. The only file in this route carrying `'use server'`.
 */
export type RevalidateResult = { ok: true } | { ok: false; error: string }

/**
 * Reads content for a locale and the namespaces in the URL.
 *
 * Both arguments are re-validated rather than trusted: every export here is a public POST endpoint,
 * the namespaces land in a `filter[namespace][_in]` against a token that can read the whole
 * collection, and the locale becomes part of a CMS query.
 */
export async function getContentAction(
    locale: string,
    input: Record<string, string | string[] | undefined>
): Promise<ContentResult> {
    return getWebContents(resolveLocale(locale), parseNamespaces(input))
}

/**
 * `updateTag` rather than `revalidateTag`: inside a Server Action it expires the tag *and* gives
 * read-your-own-writes semantics, so the re-render triggered by this action already sees the fresh
 * fetch. `revalidateTag(tag, profile)` is the one to use from a route handler — which is where this
 * belongs in a real app, called by a Directus webhook on publish. The button is the manual
 * equivalent, so the caching story is visible without waiting an hour for the window to expire.
 */
export async function revalidateContentAction(): Promise<RevalidateResult> {
    try {
        updateTag(DIRECTUS_CACHE_TAG)
        logger.info('directus/action: cache tag updated', { tag: DIRECTUS_CACHE_TAG })
        return { ok: true }
    } catch (error) {
        logger.error('directus/action: revalidate failed', { error })
        return { ok: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
}
