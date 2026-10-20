'use server'

import { findUsers } from '@libs/user/service'
import type { PiUser } from '@libs/user/definitions'
import { logger } from '@libs/logger'
import { parseFilters } from './filters'

/**
 * Server Actions for the users page. By convention this is the only file under `app/users/` allowed
 * to carry `'use server'`, so there is one place to look for the module's write/fetch surface.
 *
 * Note what `'use server'` costs: every export here becomes a public POST endpoint that any client
 * can call with any argument. So the input is re-parsed through {@link parseFilters} rather than
 * trusted — the caller is not necessarily this app's own UI.
 *
 * Every export must be an async function; the pure helpers live in `./filters`.
 */
export type SearchUsersResult = { ok: true; users: PiUser[] } | { ok: false; error: string }

/**
 * Returns a result object instead of throwing.
 *
 * A Server Action's rejection reaches the client as a generic "An error occurred in the Server
 * Components render" with the real message stripped in production, which is useless to the caller.
 * Returning the failure explicitly lets the page render something specific, and lets a client
 * component show it without an error boundary.
 */
export async function searchUsersAction(
    input: Record<string, string | string[] | undefined>
): Promise<SearchUsersResult> {
    const filters = parseFilters(input)

    try {
        return { ok: true, users: await findUsers(filters) }
    } catch (error) {
        // Already logged with full context in the service; this only records that the action
        // boundary swallowed it.
        logger.warn('users/action: search failed', { filters })
        return { ok: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
}
