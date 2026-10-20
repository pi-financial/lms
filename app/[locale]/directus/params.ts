import { ContentNamespace } from '@libs/directus/definitions'

/**
 * Pure helpers, kept out of `action.ts` because a `'use server'` module may only export async
 * functions.
 *
 * Language is deliberately *not* read from the URL. It comes from the locale cookie the nav
 * switcher writes, so there is exactly one control for it — a `?language=` override would silently
 * win over the switcher and make it look broken on this page.
 */
export const DEFAULT_NAMESPACES: ContentNamespace[] = [ContentNamespace.Common]

const NAMESPACE_IDS = new Set<number>(Object.values(ContentNamespace).filter(v => typeof v === 'number'))

/**
 * Reads the namespaces out of an untrusted record.
 *
 * Checked against the enum rather than passed through as numbers: they go straight into a
 * `filter[namespace][_in]`, and the token has read access to the whole collection, so an arbitrary
 * id would let a caller page through namespaces this app was never meant to expose.
 */
export function parseNamespaces(input: Record<string, string | string[] | undefined>): ContentNamespace[] {
    const raw = Array.isArray(input.namespaces) ? input.namespaces[0] : input.namespaces

    const namespaces = (raw ?? '')
        .split(',')
        .map(part => Number(part.trim()))
        .filter(id => NAMESPACE_IDS.has(id)) as ContentNamespace[]

    return namespaces.length > 0 ? namespaces : DEFAULT_NAMESPACES
}
