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
