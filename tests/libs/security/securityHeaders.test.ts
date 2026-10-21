/** @jest-environment node */
import {
    buildSecurityHeaderRules,
    buildSecurityHeaders,
    contentSecurityPolicy
} from '@libs/security/securityHeaders.mjs'

type Header = { key: string; value: string }

const find = (headers: Header[], key: string) => headers.find(h => h.key === key)

describe('security headers', () => {
    it('enforces the CSP by default', () => {
        const headers = buildSecurityHeaders() as Header[]

        expect(find(headers, 'Content-Security-Policy')?.value).toBe(contentSecurityPolicy)
        expect(find(headers, 'Content-Security-Policy-Report-Only')).toBeUndefined()
    })

    it('switches to report-only when asked', () => {
        const headers = buildSecurityHeaders({ enforce: false }) as Header[]

        expect(find(headers, 'Content-Security-Policy-Report-Only')?.value).toBe(contentSecurityPolicy)
        expect(find(headers, 'Content-Security-Policy')).toBeUndefined()
    })

    it('locks down the directives that have no legitimate caller', () => {
        // Loosening any of these is a deliberate decision, so make it show up in a diff.
        expect(contentSecurityPolicy).toContain("default-src 'self'")
        expect(contentSecurityPolicy).toContain("object-src 'none'")
        expect(contentSecurityPolicy).toContain("base-uri 'self'")
        expect(contentSecurityPolicy).toContain("form-action 'self'")
        expect(contentSecurityPolicy).toContain("frame-ancestors 'self'")
    })

    it('does not allow eval or wildcard sources anywhere', () => {
        expect(contentSecurityPolicy).not.toContain('unsafe-eval')
        expect(contentSecurityPolicy).not.toMatch(/(?:^|[\s;])\*/)
    })

    it('ships the non-CSP hardening headers', () => {
        const headers = buildSecurityHeaders() as Header[]

        expect(find(headers, 'X-Content-Type-Options')?.value).toBe('nosniff')
        expect(find(headers, 'X-Frame-Options')?.value).toBe('SAMEORIGIN')
        expect(find(headers, 'Referrer-Policy')?.value).toBe('strict-origin-when-cross-origin')
        // `preload` is irreversible in practice and is the platform team's call, not this repo's.
        expect(find(headers, 'Strict-Transport-Security')?.value).not.toContain('preload')
    })

    it('applies to every path', () => {
        const rules = buildSecurityHeaderRules() as { source: string; headers: Header[] }[]

        expect(rules).toHaveLength(1)
        expect(rules[0].source).toBe('/:path*')
    })
})

/**
 * The policy is built at import time from `NODE_ENV` and the issuer, so each case re-imports the
 * module inside an isolated registry with the environment already set.
 */
function policyUnder(env: Record<string, string | undefined>): string {
    let csp = ''
    jest.isolateModules(() => {
        const previous = { ...process.env }
        Object.assign(process.env, env)
        try {
            csp = (require('@libs/security/securityHeaders.mjs') as { contentSecurityPolicy: string })
                .contentSecurityPolicy
        } finally {
            process.env = previous
        }
    })
    return csp
}

const ISSUER = 'https://login.microsoftonline.com/bfddd0fc-7ea7-4d70-adab-75e7bc3bb64a/v2.0'

describe('CSP by environment', () => {
    /**
     * React's development build calls `eval()` to rebuild stack traces across the server/client
     * boundary. Without this the dev server logs a violation on every page and loses the error
     * overlay.
     */
    it('allows eval and the HMR socket in development', () => {
        const csp = policyUnder({ NODE_ENV: 'development', AUTH_MICROSOFT_ENTRA_ID_ISSUER: ISSUER })

        expect(csp).toContain("'unsafe-eval'")
        expect(csp).toContain('ws:')
    })

    /** The production build never calls `eval()`, and allowing it there would be a real weakening. */
    it('allows neither in production', () => {
        const csp = policyUnder({ NODE_ENV: 'production', AUTH_MICROSOFT_ENTRA_ID_ISSUER: ISSUER })

        expect(csp).not.toContain("'unsafe-eval'")
        expect(csp).not.toContain('ws:')
    })
})

describe('form-action and the identity provider', () => {
    /**
     * Signing in and signing out are form posts that Auth.js turns into navigations to Entra.
     * `'self'` alone blocks both, and the failure is a dead button with a console warning.
     */
    it('admits the tenant origin, without its path', () => {
        const csp = policyUnder({ NODE_ENV: 'production', AUTH_MICROSOFT_ENTRA_ID_ISSUER: ISSUER })
        const formAction = csp.split('; ').find(d => d.startsWith('form-action'))

        expect(formAction).toBe("form-action 'self' https://login.microsoftonline.com")
        // An origin, not the issuer: a CSP source carrying a path matches nothing.
        expect(formAction).not.toContain('/v2.0')
    })

    /**
     * Sign-in is already impossible without an issuer, so falling back to `'self'` costs nothing —
     * where silently admitting an unparsed value would be the worse failure.
     */
    it('falls back to self when the issuer is unset or malformed', () => {
        for (const issuer of [undefined, 'not-a-url']) {
            const csp = policyUnder({ NODE_ENV: 'production', AUTH_MICROSOFT_ENTRA_ID_ISSUER: issuer })
            expect(csp.split('; ').find(d => d.startsWith('form-action'))).toBe("form-action 'self'")
        }
    })

    /** The tenant is reached by navigation, not by fetch — `connect-src` is the wrong directive. */
    it('does not widen connect-src for the tenant', () => {
        const csp = policyUnder({ NODE_ENV: 'production', AUTH_MICROSOFT_ENTRA_ID_ISSUER: ISSUER })
        expect(csp.split('; ').find(d => d.startsWith('connect-src'))).toBe("connect-src 'self'")
    })
})

/**
 * A blocked iframe renders as an empty box with a console warning and no error anywhere a user or
 * a test would see — which is exactly the failure a test has to catch rather than discover in
 * staging.
 */
describe('frame-src and the video embed', () => {
    it('admits the YouTube player hosts and nothing else', () => {
        const csp = policyUnder({ NODE_ENV: 'production', AUTH_MICROSOFT_ENTRA_ID_ISSUER: ISSUER })
        const frameSrc = csp.split('; ').find(d => d.startsWith('frame-src'))

        expect(frameSrc).toBe("frame-src 'self' https://www.youtube-nocookie.com https://www.youtube.com")
    })

    /** An embed is a frame, not a fetch — widening connect-src for it would be the wrong directive. */
    it('does not widen connect-src for the embed', () => {
        const csp = policyUnder({ NODE_ENV: 'production', AUTH_MICROSOFT_ENTRA_ID_ISSUER: ISSUER })
        expect(csp.split('; ').find(d => d.startsWith('connect-src'))).toBe("connect-src 'self'")
    })

    /** frame-ancestors governs who may frame *us*, and admitting YouTube there would be backwards. */
    it('keeps frame-ancestors to this origin', () => {
        const csp = policyUnder({ NODE_ENV: 'production', AUTH_MICROSOFT_ENTRA_ID_ISSUER: ISSUER })
        expect(csp.split('; ').find(d => d.startsWith('frame-ancestors'))).toBe("frame-ancestors 'self'")
    })
})

/**
 * The player loads YouTube's IFrame API so it can refuse a forward seek. A blocked script here
 * fails the same silent way a blocked frame does — the video simply never appears — except the
 * consequence is worse: the embed falls back to nothing rather than to an unguarded player.
 */
describe('script-src and the player API', () => {
    it('admits the IFrame API and the CDN it pulls in', () => {
        const csp = policyUnder({ NODE_ENV: 'production', AUTH_MICROSOFT_ENTRA_ID_ISSUER: ISSUER })
        const scriptSrc = csp.split('; ').find(d => d.startsWith('script-src'))

        expect(scriptSrc).toContain('https://www.youtube.com')
        expect(scriptSrc).toContain('https://s.ytimg.com')
    })

    /** The dev-only widening must not follow the build to production. */
    it('still refuses eval in production', () => {
        const csp = policyUnder({ NODE_ENV: 'production', AUTH_MICROSOFT_ENTRA_ID_ISSUER: ISSUER })
        expect(csp.split('; ').find(d => d.startsWith('script-src'))).not.toContain("'unsafe-eval'")
    })
})
