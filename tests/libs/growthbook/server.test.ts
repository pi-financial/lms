/** @jest-environment node */
jest.mock('@libs/logger', () => ({
    logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() }
}))

const mockGetFeatureValue = jest.fn()
const mockInit = jest.fn()

jest.mock('@growthbook/growthbook', () => ({
    GrowthBookClient: jest.fn().mockImplementation(() => ({
        init: mockInit,
        createScopedInstance: jest.fn(() => ({ getFeatureValue: mockGetFeatureValue }))
    }))
}))

import { FeatureKey } from '@libs/growthbook/keys'

describe('getEvaluatedFeatures', () => {
    beforeEach(() => {
        jest.resetModules()
        mockInit.mockReset().mockResolvedValue({ success: true, source: 'network' })
        mockGetFeatureValue.mockReset()
        delete globalThis.__growthBookClient
        delete globalThis.__growthBookReady
    })

    /**
     * Without a key the SDK would still spin up a client and poll a CDN it cannot authenticate
     * against. Short-circuiting keeps local development quiet and makes the fallback explicit.
     */
    it('falls back to null for every key when no client key is configured', async () => {
        delete process.env.GROWTHBOOK_KEY
        const { getEvaluatedFeatures } = await import('@libs/growthbook/server')

        await expect(getEvaluatedFeatures()).resolves.toEqual({
            [FeatureKey.CookiePolicyId]: { defaultValue: null }
        })
        expect(mockInit).not.toHaveBeenCalled()
    })

    it('returns the evaluated value for every registered key, and nothing else', async () => {
        process.env.GROWTHBOOK_KEY = 'sdk-test'
        mockGetFeatureValue.mockReturnValue(true)
        const { getEvaluatedFeatures } = await import('@libs/growthbook/server')

        const features = await getEvaluatedFeatures({ userId: 'u1' })

        // The payload shipped to the browser is bounded by the enum — no stray flags, no rules.
        expect(Object.keys(features)).toEqual([FeatureKey.CookiePolicyId])
        expect(features[FeatureKey.CookiePolicyId]).toEqual({ defaultValue: true })
    })

    it('still resolves when init fails, so a CDN outage cannot take the page down', async () => {
        process.env.GROWTHBOOK_KEY = 'sdk-test'
        mockInit.mockRejectedValue(new Error('ENOTFOUND cdn.growthbook.io'))
        mockGetFeatureValue.mockReturnValue(null)
        const { getEvaluatedFeatures } = await import('@libs/growthbook/server')

        await expect(getEvaluatedFeatures()).resolves.toEqual({
            [FeatureKey.CookiePolicyId]: { defaultValue: null }
        })
    })
})
