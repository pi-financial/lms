'use server'

import { getEvaluatedFeatures } from '@libs/growthbook/server'
import type { EvaluatedFeatures } from '@libs/growthbook/keys'
import { logger } from '@libs/logger'
import { parseAttributes } from './attributes'

/**
 * Server Actions for the GrowthBook demo. The only file in this route carrying `'use server'`.
 *
 * Evaluation stays on the server on purpose — see `libs/growthbook/server.ts`. The action exists so
 * the page and any client-triggered re-evaluation share one entry point, with the attribute
 * allow-list applied in both cases.
 */
export type EvaluateResult = { ok: true; features: EvaluatedFeatures } | { ok: false; error: string }

export async function evaluateFeaturesAction(
    input: Record<string, string | string[] | undefined>
): Promise<EvaluateResult> {
    const attributes = parseAttributes(input)

    try {
        return { ok: true, features: await getEvaluatedFeatures(attributes) }
    } catch (error) {
        logger.warn('growthbook/action: evaluation failed', { attributes })
        return { ok: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
}
