/** @jest-environment node */
import { getEnvironment, getLoggerConfig } from '@libs/logger/config'

describe('getEnvironment', () => {
    const original = { ...process.env }
    afterEach(() => {
        process.env = { ...original }
    })

    /**
     * SigNoz filters on `deployment.environment` as an opaque string, so `staging` and `Staging`
     * would show up as two unrelated environments across every dashboard.
     */
    it.each([
        ['Development', 'Development'],
        ['development', 'Development'],
        ['staging', 'Staging'],
        ['Staging', 'Staging'],
        ['production', 'Production'],
        ['  staging  ', 'Staging']
    ])('normalises %p to %p', (input, expected) => {
        process.env.NEXT_PUBLIC_DEPLOYMENT_ENV = input
        expect(getEnvironment()).toBe(expected)
    })

    it('falls back to a capitalised NODE_ENV when the deployment env is unset', () => {
        delete process.env.NEXT_PUBLIC_DEPLOYMENT_ENV
        expect(getEnvironment()).toBe('Test')
    })

    it('feeds the same value into the logger config', () => {
        process.env.NEXT_PUBLIC_DEPLOYMENT_ENV = 'staging'
        expect(getLoggerConfig().environment).toBe('Staging')
    })
})
