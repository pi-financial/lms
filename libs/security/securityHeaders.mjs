/**
 * Baseline security response headers, applied to every route by `headers()` in `next.config.mjs`.
 *
 * Plain `.mjs` and not TypeScript because `next.config.mjs` is loaded by Next before any transpile
 * step runs, so it can only import JS.
 *
 * This is the *boilerplate* policy: it assumes the browser talks only to this Next.js app (BFF
 * pattern) and loads no third party. Every vendor you add — analytics, a video embed, a chart
 * library that spawns workers — needs its own entry here, and adding one is the moment to consider
 * flipping to `enforce: false` on staging first so violations get reported instead of blocked.
 */
export const CSP_ENFORCED_HEADER = 'Content-Security-Policy'
export const CSP_REPORT_ONLY_HEADER = 'Content-Security-Policy-Report-Only'

const CSP_DIRECTIVES = [
    "default-src 'self'",

    // Next injects an inline bootstrap script on every page, so 'unsafe-inline' is unavoidable
    // without nonces. To drop it: generate a nonce in `proxy.ts`, pass it through a request header,
    // and swap this for `'nonce-<value>' 'strict-dynamic'`. That forces every route onto dynamic
    // rendering, which is why the boilerplate does not do it by default.
    "script-src 'self' 'unsafe-inline'",

    // Tailwind ships a static stylesheet, but Next still inlines critical CSS during streaming.
    "style-src 'self' 'unsafe-inline'",

    // The browser talks only to this app. Add API/analytics origins here as you introduce them.
    "connect-src 'self'",

    "img-src 'self' data: blob: https:",
    "font-src 'self' data:",

    // Anti-clickjacking. 'self' rather than 'none' so the app may frame its own documents
    // (PDF previews and the like); tighten to 'none' if it never does.
    "frame-ancestors 'self'",
    "frame-src 'self'",

    // Cheap hardening with no caller in a fresh app: no plugins, no injected <base href>,
    // and forms may only post back to us.
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'"
]

export const contentSecurityPolicy = CSP_DIRECTIVES.join('; ')

/**
 * @param {{ enforce?: boolean }} [options] `enforce: false` swaps the real header for the
 *   report-only one — useful while widening the allowlist for a newly added third party.
 */
export const buildSecurityHeaders = ({ enforce = true } = {}) => [
    { key: enforce ? CSP_ENFORCED_HEADER : CSP_REPORT_ONLY_HEADER, value: contentSecurityPolicy },
    // No `preload`: submitting the apex domain to the browsers' preload list forces HTTPS on every
    // subdomain and is not reversible on any useful timescale, so it is the platform team's call.
    { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' },
    // Fallback for browsers that ignore frame-ancestors. SAMEORIGIN rather than DENY to match
    // the frame-ancestors directive above.
    { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
    { key: 'X-Content-Type-Options', value: 'nosniff' },
    // Full URL same-origin, bare origin cross-origin — a third party never sees a `?token=` value.
    { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' }
]

/** The shape Next's `headers()` returns: one rule covering every path. */
export const buildSecurityHeaderRules = options => [
    {
        source: '/:path*',
        headers: buildSecurityHeaders(options)
    }
]
