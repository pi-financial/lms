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

/**
 * Origin of the identity provider, derived from the issuer rather than written twice.
 *
 * A CSP directive takes an origin, not a path, so the tenant path is dropped. An unset or
 * malformed issuer yields an empty string and the directive falls back to `'self'` — which is the
 * right failure: sign-in is already impossible without an issuer, and a policy that silently
 * allows an unknown origin would be worse than one that blocks a form post.
 */
const ENTRA_ORIGIN = (() => {
    try {
        return new URL(process.env.AUTH_MICROSOFT_ENTRA_ID_ISSUER ?? '').origin
    } catch {
        return ''
    }
})()

/**
 * React's development build calls `eval()` to rebuild stack traces across the server/client
 * boundary, so a dev server under the production policy logs a CSP violation on every page and
 * loses the error overlay. The production build never calls it — React says so itself in the
 * message — which is why this is widened for `next dev` only and not by a flag someone could
 * leave on.
 */
const DEV = process.env.NODE_ENV === 'development'

const CSP_DIRECTIVES = [
    "default-src 'self'",

    // Next injects an inline bootstrap script on every page, so 'unsafe-inline' is unavoidable
    // without nonces. To drop it: generate a nonce in `proxy.ts`, pass it through a request header,
    // and swap this for `'nonce-<value>' 'strict-dynamic'`. That forces every route onto dynamic
    // rendering, which is why the boilerplate does not do it by default.
    //
    // `youtube.com` is the IFrame Player API (`iframe_api`), which the course player loads so it
    // can refuse a forward seek — the embedded controls cannot be told to refuse one, so the page
    // draws its own. The API immediately loads a second script from `ytimg.com`, its CDN.
    `script-src 'self' 'unsafe-inline' https://www.youtube.com https://s.ytimg.com${DEV ? " 'unsafe-eval'" : ''}`,

    // Tailwind ships a static stylesheet, but Next still inlines critical CSS during streaming.
    "style-src 'self' 'unsafe-inline'",

    // The browser talks only to this app. Add API/analytics origins here as you introduce them.
    //
    // Sign-in is a top-level navigation to Entra, not a fetch, so the tenant does not belong
    // here — `form-action` below is the directive that governs it.
    //
    // In development the dev server's HMR socket is a ws:// connection to the same origin, which
    // `'self'` does not cover.
    `connect-src 'self'${DEV ? ' ws: wss:' : ''}`,

    "img-src 'self' data: blob: https:",
    "font-src 'self' data:",

    // Anti-clickjacking. 'self' rather than 'none' so the app may frame its own documents
    // (PDF previews and the like); tighten to 'none' if it never does.
    "frame-ancestors 'self'",

    // Course videos are YouTube embeds. `-nocookie` is the host the player is embedded from — it
    // serves the same player without writing a tracking cookie before playback — and
    // `youtube.com` is still needed because the nocookie player redirects some requests there.
    // Without both, the iframe is blocked and the pane renders empty with only a console warning.
    "frame-src 'self' https://www.youtube-nocookie.com https://www.youtube.com",

    // Cheap hardening with no caller in a fresh app: no plugins, no injected <base href>,
    // and forms may only post back to us.
    "object-src 'none'",
    "base-uri 'self'",

    // Sign-out posts a form to Entra's end-session endpoint, and the sign-in button is a form
    // POST that Auth.js turns into a redirect there. `'self'` alone blocks both.
    `form-action 'self'${ENTRA_ORIGIN ? ` ${ENTRA_ORIGIN}` : ''}`
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
