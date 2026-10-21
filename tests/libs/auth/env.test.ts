/** @jest-environment node */

/**
 * `authConfigured` decides whether the sign-in button is live. It is read at import time, so each
 * case re-imports the module inside an isolated registry with the environment already set.
 */
const TENANT = 'bfddd0fc-7ea7-4d70-adab-75e7bc3bb64a'

const VALID = {
    AUTH_SECRET: 's'.repeat(32),
    AUTH_MICROSOFT_ENTRA_ID_ID: '828e23ef-8d59-4ec6-985b-bf6608f33482',
    AUTH_MICROSOFT_ENTRA_ID_SECRET: 'client-secret',
    AUTH_MICROSOFT_ENTRA_ID_ISSUER: `https://login.microsoftonline.com/${TENANT}/v2.0`,
    AUTH_URL: 'https://lms.pi.financial'
}

function load(env: Record<string, string | undefined>) {
    let mod!: typeof import('@libs/auth/env')
    jest.isolateModules(() => {
        const previous = { ...process.env }
        Object.assign(process.env, env)
        try {
            mod = require('@libs/auth/env')
        } finally {
            process.env = previous
        }
    })
    return mod
}

describe('authConfigured', () => {
    it('is true when every variable is present and well formed', () => {
        expect(load({ ...VALID, NODE_ENV: 'development' }).authConfigured).toBe(true)
    })

    it('is false when a variable is missing', () => {
        const { AUTH_MICROSOFT_ENTRA_ID_ID: _omitted, ...rest } = VALID
        expect(load({ ...rest, AUTH_MICROSOFT_ENTRA_ID_ID: undefined, NODE_ENV: 'development' }).authConfigured).toBe(
            false
        )
    })

    /** A trailing slash is what the Auth.js documentation itself prints, so it has to pass. */
    it('accepts the tenant issuer with or without a trailing slash', () => {
        const issuer = `https://login.microsoftonline.com/${TENANT}/v2.0/`
        expect(load({ ...VALID, AUTH_MICROSOFT_ENTRA_ID_ISSUER: issuer, NODE_ENV: 'development' }).authConfigured).toBe(
            true
        )
    })

    /**
     * The case this refinement exists for. Left on `common` the provider admits any Microsoft
     * account — a personal outlook.com one included — into an app whose only intended users are
     * employees. That is a valid URL and a working sign-in, which is exactly why it has to fail
     * here rather than in production.
     */
    it('rejects a multi-tenant issuer, which would admit personal accounts', () => {
        for (const bad of [
            'https://login.microsoftonline.com/common/v2.0',
            'https://login.microsoftonline.com/organizations/v2.0',
            'https://login.microsoftonline.com/consumers/v2.0',
            `https://login.microsoftonline.com/${TENANT}`,
            `https://login.microsoftonline.com/${TENANT}/oauth2/v2.0/authorize`,
            'https://login.example.com/' + TENANT + '/v2.0'
        ]) {
            expect(
                load({ ...VALID, AUTH_MICROSOFT_ENTRA_ID_ISSUER: bad, NODE_ENV: 'development' }).authConfigured
            ).toBe(false)
        }
    })
})

describe('authEnv in development', () => {
    /** The screens behind the login have to be buildable before the Entra app registration exists. */
    it('falls back to placeholders rather than throwing', () => {
        expect(() => load({ NODE_ENV: 'development', AUTH_SECRET: undefined })).not.toThrow()
    })
})

describe('authEnv in production', () => {
    /** A login page that works until someone presses the button is worse than one that never started. */
    it('throws rather than starting with placeholders', () => {
        expect(() => load({ NODE_ENV: 'production', AUTH_SECRET: undefined })).toThrow(/Invalid auth environment/)
    })
})
