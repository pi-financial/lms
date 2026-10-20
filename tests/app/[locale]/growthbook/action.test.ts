/** @jest-environment node */
const mockGetEvaluatedFeatures = jest.fn()
jest.mock('@libs/growthbook/server', () => ({
    getEvaluatedFeatures: (...args: unknown[]) => mockGetEvaluatedFeatures(...args)
}))
jest.mock('@libs/logger', () => ({
    logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() }
}))

import { evaluateFeaturesAction } from '@app/[locale]/growthbook/action'

describe('evaluateFeaturesAction', () => {
    it('applies the attribute allow-list before evaluating', async () => {
        mockGetEvaluatedFeatures.mockResolvedValue({})

        // A Server Action is a public POST endpoint, so `isAdmin` must not become a targeting input.
        await evaluateFeaturesAction({ userId: 'u1', isAdmin: 'true' })

        expect(mockGetEvaluatedFeatures).toHaveBeenCalledWith({ userId: 'u1' })
    })

    it('returns the evaluated features on success', async () => {
        mockGetEvaluatedFeatures.mockResolvedValue({ 'cookie-policy-id': { defaultValue: true } })

        await expect(evaluateFeaturesAction({})).resolves.toEqual({
            ok: true,
            features: { 'cookie-policy-id': { defaultValue: true } }
        })
    })

    it('returns the failure instead of throwing, so the page can render it', async () => {
        mockGetEvaluatedFeatures.mockRejectedValue(new Error('boom'))

        await expect(evaluateFeaturesAction({})).resolves.toEqual({ ok: false, error: 'boom' })
    })
})
