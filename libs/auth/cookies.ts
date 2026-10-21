/**
 * Auth.js cookie names scoped to one app.
 *
 * Cookies are keyed by host and ignore the port, so every Next app on `localhost` shares one jar.
 * Auth.js names its cookies `authjs.*` by default, which is how console-web (:3001) and
 * backoffice-pro (:3000) came to write the same six cookies over each other. Worse than the
 * overwrite: both apps read the same AUTH_SECRET, and the session JWE is salted with the cookie
 * name, so the foreign token also decrypted — the app admitted the wrong user with the wrong
 * roles instead of signing them out. Naming the cookies per app separates the jar and the salt in
 * one move.
 *
 * Everything here matches `defaultCookies()` in @auth/core (`lib/utils/cookie.js`) apart from the
 * name, so nothing about the sign-in flow changes.
 */

type CookieName = 'sessionToken' | 'callbackUrl' | 'csrfToken' | 'pkceCodeVerifier' | 'state' | 'nonce'

type AppCookie = {
    name: string
    options: {
        httpOnly: true
        sameSite: 'lax'
        path: '/'
        secure: boolean
        maxAge?: number
    }
}

export function appCookies(app: string, secure: boolean): Record<CookieName, AppCookie> {
    const prefix = secure ? '__Secure-' : ''
    const base = { httpOnly: true, sameSite: 'lax', path: '/', secure } as const

    return {
        sessionToken: { name: `${prefix}${app}.session-token`, options: { ...base } },
        callbackUrl: { name: `${prefix}${app}.callback-url`, options: { ...base } },
        // `__Host-` is the stricter prefix Auth.js reserves for the CSRF token.
        csrfToken: { name: `${secure ? '__Host-' : ''}${app}.csrf-token`, options: { ...base } },
        pkceCodeVerifier: {
            name: `${prefix}${app}.pkce.code_verifier`,
            options: { ...base, maxAge: 60 * 15 }
        },
        state: { name: `${prefix}${app}.state`, options: { ...base, maxAge: 60 * 15 } },
        nonce: { name: `${prefix}${app}.nonce`, options: { ...base } }
    }
}

/**
 * Whether this app is served over https, which is what Auth.js reads to decide the `Secure` flag
 * and the `__Secure-` / `__Host-` prefixes. Reading the app's own AUTH_URL keeps each deployment on
 * the flag it actually needs — a Secure cookie on an http response is one no browser stores.
 */
export function usesSecureCookies(authUrl: string | undefined): boolean {
    return (authUrl ?? '').startsWith('https://')
}
