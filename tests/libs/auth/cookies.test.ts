/** @jest-environment node */
import { appCookies, usesSecureCookies } from '@libs/auth/cookies'

/**
 * Cookies are keyed by host and ignore the port, so every Next app on localhost shares one jar.
 * With the default `authjs.*` names and a shared AUTH_SECRET, one app's session decrypts in
 * another — which is how console-web and backoffice-pro came to admit each other's users.
 */
describe('appCookies', () => {
    it('names every cookie after the app', () => {
        const c = appCookies('lms', false)
        expect(c.sessionToken.name).toBe('lms.session-token')
        expect(c.callbackUrl.name).toBe('lms.callback-url')
        expect(c.csrfToken.name).toBe('lms.csrf-token')
    })

    it('does not collide with another app on the same host', () => {
        const lms = appCookies('lms', false)
        const console_ = appCookies('console-web', false)
        expect(lms.sessionToken.name).not.toBe(console_.sessionToken.name)
    })

    it('adds the __Secure- prefix over https, and __Host- for CSRF', () => {
        const c = appCookies('lms', true)
        expect(c.sessionToken.name).toBe('__Secure-lms.session-token')
        expect(c.csrfToken.name).toBe('__Host-lms.csrf-token')
        expect(c.sessionToken.options.secure).toBe(true)
    })

    it('keeps the short lifetime on the single-use OAuth cookies', () => {
        const c = appCookies('lms', false)
        expect(c.pkceCodeVerifier.options.maxAge).toBe(900)
        expect(c.state.options.maxAge).toBe(900)
        expect(c.sessionToken.options.maxAge).toBeUndefined()
    })
})

describe('usesSecureCookies', () => {
    it('is driven by the app’s own origin', () => {
        expect(usesSecureCookies('https://lms.pi.financial')).toBe(true)
        expect(usesSecureCookies('http://localhost:3000')).toBe(false)
    })

    /** An unset AUTH_URL must not produce a Secure cookie no browser would store. */
    it('defaults to insecure when AUTH_URL is unset', () => {
        expect(usesSecureCookies(undefined)).toBe(false)
    })
})
