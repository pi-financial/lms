import 'server-only'

import { GrowthBookClient } from '@growthbook/growthbook'
import { logger } from '@libs/logger'
import { ALL_FEATURE_KEYS, type EvaluatedFeatures } from './keys'

/**
 * Server-side GrowthBook.
 *
 * Uses the SDK's own `GrowthBookClient` rather than fetching the payload by hand: it owns the
 * cache, the background refresh and the payload decryption, and it is the API GrowthBook supports
 * for multi-user server processes — one long-lived client, one cheap scoped instance per request.
 *
 * The raw payload contains targeting rules — who is in which experiment, which segments exist.
 * That is business information, so it stays here: `getEvaluatedFeatures()` runs the rules on the
 * server and ships only the resulting values. The browser learns *what* it gets, never *why*.
 */
const INIT_TIMEOUT_MS = 3000

declare global {
    var __growthBookClient: GrowthBookClient | undefined
    var __growthBookReady: Promise<void> | undefined
}

function createClient(): GrowthBookClient {
    return new GrowthBookClient({
        apiHost: process.env.GROWTHBOOK_HOST || 'https://cdn.growthbook.io',
        // The SDK client key, e.g. `sdk-abc123`. It is read-only and scoped to one environment.
        clientKey: process.env.GROWTHBOOK_KEY ?? ''
    })
}

/**
 * One client per process, cached on `globalThis` so Next's dev-mode module reloading does not leave
 * a new polling client behind on every edit.
 *
 * `init` is awaited through a shared promise rather than a boolean flag: concurrent requests during
 * a cold start would otherwise each kick off their own fetch.
 */
async function getClient(): Promise<GrowthBookClient> {
    if (!globalThis.__growthBookClient) {
        globalThis.__growthBookClient = createClient()

        globalThis.__growthBookReady = globalThis.__growthBookClient
            // `streaming` keeps the payload fresh over SSE instead of re-fetching per request.
            .init({ timeout: INIT_TIMEOUT_MS, streaming: true })
            .then(result => {
                if (!result.success) {
                    logger.warn('GrowthBook: init did not load a payload — flags fall back to defaults', {
                        source: result.source,
                        error: result.error
                    })
                }
            })
            .catch(error => {
                // Never rethrow: a CDN outage must not take down every page that reads a flag.
                logger.error('GrowthBook: init failed — flags fall back to defaults', { error })
            })
    }

    await globalThis.__growthBookReady
    return globalThis.__growthBookClient
}

export type FeatureAttributes = Record<string, unknown>

/**
 * Evaluates every {@link FeatureKey} for the given attributes.
 *
 * Pass whatever you target on — user id, device id, country. With no attributes you get each flag's
 * default rule, which is the right answer for anonymous pages.
 */
export async function getEvaluatedFeatures(attributes: FeatureAttributes = {}): Promise<EvaluatedFeatures> {
    if (!process.env.GROWTHBOOK_KEY) {
        logger.warn('GrowthBook: GROWTHBOOK_KEY not set — all flags fall back to defaults')
        return Object.fromEntries(ALL_FEATURE_KEYS.map(key => [key, { defaultValue: null }]))
    }

    const client = await getClient()
    // Scoped instances are per-request and hold no resources of their own — the payload, the cache
    // and the refresh loop all live on the shared client — so there is nothing to tear down.
    const scoped = client.createScopedInstance({ attributes })

    return Object.fromEntries(ALL_FEATURE_KEYS.map(key => [key, { defaultValue: scoped.getFeatureValue(key, null) }]))
}
