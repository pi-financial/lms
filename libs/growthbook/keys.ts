/**
 * The single registry of feature-flag names.
 *
 * Everything else keys off this enum: the server only evaluates flags listed here, and the payload
 * shipped to the browser contains exactly these keys. A flag that exists in the GrowthBook UI but
 * not here is simply never read — which is the point. It keeps the client payload bounded and makes
 * "which flags does this app use?" answerable by reading one file.
 */
export enum FeatureKey {
    /** Example boolean flag. Replace with your own; kept so the wiring has something to exercise. */
    CookiePolicyId = 'cookie-policy-id'
}

export const ALL_FEATURE_KEYS = Object.values(FeatureKey)

/** Shape sent to the browser: each key already evaluated for this request's attributes. */
export type EvaluatedFeatures = Record<string, { defaultValue: unknown }>
