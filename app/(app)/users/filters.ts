import type { UserFilters } from '@libs/user/definitions'

/**
 * Pure filter helpers, kept out of `action.ts` because a `'use server'` module may only export
 * async functions — a constant or a sync helper there is a build error.
 */
export const DEFAULT_ACCOUNT_ID = '0900097'

export const FILTER_KEYS = ['accountId', 'citizenId', 'email', 'firstName', 'lastName', 'phoneNumber', 'ids'] as const

/**
 * Picks known filters out of an untrusted record — a query string, or the argument a Server Action
 * was called with. Anything not in {@link FILTER_KEYS} is dropped, so a stray `?utm_source=` never
 * reaches the service, and neither does a hand-crafted POST body.
 */
export function parseFilters(input: Record<string, string | string[] | undefined>): UserFilters {
    const filters: UserFilters = {}

    for (const key of FILTER_KEYS) {
        const raw = input[key]
        const value = Array.isArray(raw) ? raw[0] : raw
        // Blank values are dropped rather than forwarded: the service treats a present-but-empty
        // filter as a real one and matches nothing.
        if (value?.trim()) filters[key] = value.trim()
    }

    // With no filters at all the endpoint returns every user, so the demo seeds the account.
    if (Object.keys(filters).length === 0) filters.accountId = DEFAULT_ACCOUNT_ID

    return filters
}
