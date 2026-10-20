import 'server-only'

import { createDirectus, rest, staticToken } from '@directus/sdk'
import type { DirectusSchema } from './definitions'

/**
 * Directus CMS client, server-side only.
 *
 * `DIRECTUS_TOKEN` is a static service token with read access — it must never reach the browser,
 * which is why content is fetched in Server Components and passed down as props rather than through
 * a client-side SDK. The `server-only` import turns a mistake here into a build error.
 *
 * Types and the namespace enum live in `./definitions` so client components can use them without
 * pulling this module in.
 */
let client: ReturnType<typeof buildClient> | null = null

function buildClient() {
    // Base URL only: the SDK appends `/items` itself.
    const url = process.env.DIRECTUS_HOST
    const token = process.env.DIRECTUS_TOKEN ?? ''

    if (!url) throw new Error('DIRECTUS_HOST is not set — see .env.example')

    return createDirectus<DirectusSchema>(url).with(staticToken(token)).with(rest())
}

export function getDirectusClient() {
    return (client ??= buildClient())
}
