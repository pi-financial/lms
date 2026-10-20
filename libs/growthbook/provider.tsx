'use client'

import { GrowthBook, GrowthBookProvider } from '@growthbook/growthbook-react'
import { useEffect, useMemo, type ReactNode } from 'react'
import type { EvaluatedFeatures } from './keys'

/**
 * Hands the server-evaluated payload to the React tree.
 *
 * There is no client-side fetch and no streaming connection: the values were decided on the server
 * for this request, so the very first render is already correct — no flag flicker, and no GrowthBook
 * credentials in the browser bundle. Flags refresh when the page does.
 *
 * Features are passed to the constructor rather than set in an effect, otherwise the first paint
 * would run with an empty feature set and every flag would read as its fallback for one frame.
 */
export function GrowthBookAppProvider({
    initialFeatures,
    children
}: {
    initialFeatures: EvaluatedFeatures
    children: ReactNode
}) {
    const gb = useMemo(
        () =>
            new GrowthBook({
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                features: initialFeatures as any,
                enableDevMode: process.env.NODE_ENV !== 'production'
            }),
        [initialFeatures]
    )

    useEffect(() => () => gb.destroy(), [gb])

    return <GrowthBookProvider growthbook={gb}>{children}</GrowthBookProvider>
}

export { useFeatureIsOn, useFeatureValue } from '@growthbook/growthbook-react'
