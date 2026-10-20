'use client'

import { useFeatureIsOn } from '@libs/growthbook/provider'
import { FeatureKey } from '@libs/growthbook/keys'

/**
 * Reads a flag in the browser, through the provider mounted in the root layout.
 *
 * Note this can legitimately disagree with the table above: the layout evaluated the payload once,
 * for an anonymous visitor with no attributes, while the table re-evaluates for whatever is in the
 * query string. Client-side reads see the anonymous result — pass real attributes into
 * `getEvaluatedFeatures()` in the layout when you want the two to line up.
 */
export function ClientFlag() {
    // Explicit type argument: without it TS narrows the generic to this single key.
    const isOn = useFeatureIsOn<Record<string, unknown>>(FeatureKey.CookiePolicyId)

    return (
        <p className="text-body-m">
            <code>useFeatureIsOn(&apos;{FeatureKey.CookiePolicyId}&apos;)</code> in the browser →{' '}
            <strong className={isOn ? 'text-pi-mint-700' : 'text-grey-600'}>{String(isOn)}</strong>
        </p>
    )
}
