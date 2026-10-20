import type { FeatureAttributes } from '@libs/growthbook/server'

/**
 * Pure helpers, kept out of `action.ts` because a `'use server'` module may only export async
 * functions.
 */
export const ATTRIBUTE_KEYS = ['id', 'userId', 'deviceId'] as const

/**
 * Picks known targeting attributes out of an untrusted record.
 *
 * The allow-list matters more here than it looks: attributes are what GrowthBook's targeting rules
 * read, so an unfiltered passthrough would let any caller invent an attribute — and, if a rule ever
 * targets it, hand themselves into a segment.
 */
export function parseAttributes(input: Record<string, string | string[] | undefined>): FeatureAttributes {
    const attributes: FeatureAttributes = {}

    for (const key of ATTRIBUTE_KEYS) {
        const raw = input[key]
        const value = Array.isArray(raw) ? raw[0] : raw
        if (value?.trim()) attributes[key] = value.trim()
    }

    return attributes
}
