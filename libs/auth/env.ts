import { z } from 'zod'

/**
 * Auth configuration, validated strictly in production and leniently in development.
 *
 * The two have different failure modes worth protecting against. A production deployment missing a
 * variable must fail at boot — a login page that works until someone presses the button is worse
 * than one that never started. In development the app has to be runnable before the app
 * registration exists, or the screens behind the login cannot be built at all.
 */
const schema = z.object({
    /** `openssl rand -base64 32`. Salts the session JWE; rotating it signs everyone out. */
    AUTH_SECRET: z.string().min(1),

    /** Application (client) ID of the Entra app registration for this app. */
    AUTH_MICROSOFT_ENTRA_ID_ID: z.string().min(1),
    AUTH_MICROSOFT_ENTRA_ID_SECRET: z.string().min(1),

    /**
     * `https://login.microsoftonline.com/<tenant GUID>/v2.0`.
     *
     * The tenant GUID is required rather than merely conventional. Omitting the issuer makes the
     * provider fall back to `/common/`, which admits any Microsoft account — a personal
     * outlook.com one included — into an app whose only intended users are Pi employees. The
     * pattern below accepts nothing but a GUID, so `common`, `organizations` and `consumers` all
     * fail validation instead of silently widening who can sign in.
     */
    AUTH_MICROSOFT_ENTRA_ID_ISSUER: z
        .string()
        .url()
        .refine(u => /^https:\/\/login\.microsoftonline\.com\/[0-9a-f-]{36}\/v2\.0\/?$/i.test(u), {
            message:
                'must name the tenant, e.g. https://login.microsoftonline.com/<tenant GUID>/v2.0 — `common` admits personal Microsoft accounts'
        }),

    /**
     * The app's own public origin. Auth.js builds the OAuth redirect from it, and `cookies.ts`
     * reads it to decide the `Secure` flag — so an https deployment left on http silently serves
     * cookies no browser will store.
     */
    AUTH_URL: z.string().url()
})

export type AuthEnv = z.infer<typeof schema>

/**
 * Whether sign-in can actually complete.
 *
 * False means the provider is configured with placeholders: the button renders and says so, rather
 * than sending the browser to Entra with a client id that does not exist and landing it on an
 * error page that explains nothing.
 */
export const authConfigured = schema.safeParse(process.env).success

const DEV_PLACEHOLDERS: AuthEnv = {
    // Not a secret — it signs cookies that only ever exist on a developer's own machine. Any
    // deployment reaching this line has already failed validation below.
    AUTH_SECRET: 'dev-placeholder-secret-not-for-deployment',
    AUTH_MICROSOFT_ENTRA_ID_ID: 'dev-placeholder',
    AUTH_MICROSOFT_ENTRA_ID_SECRET: 'dev-placeholder',
    AUTH_MICROSOFT_ENTRA_ID_ISSUER: 'https://login.microsoftonline.com/bfddd0fc-7ea7-4d70-adab-75e7bc3bb64a/v2.0',
    AUTH_URL: 'http://localhost:3000'
}

function resolve(): AuthEnv {
    const parsed = schema.safeParse(process.env)
    if (parsed.success) return parsed.data

    const problems = parsed.error.issues.map(i => `${i.path.join('.')}: ${i.message}`)

    if (process.env.NODE_ENV === 'production') {
        console.error('❌ Invalid auth environment:', problems)
        throw new Error(`Invalid auth environment: ${problems.join('; ')}`)
    }

    // TODO(entra): remove the placeholders once the app registration exists and `.env.local` is
    // filled in. Until then the sign-in screen renders, the Microsoft button is disabled, and
    // nothing is sent to the tenant.
    console.warn(
        '⚠️  Auth is not configured — sign-in is disabled.\n' +
            problems.map(p => `   • ${p}`).join('\n') +
            '\n   See .env.example and INFRA-REQUEST.md.'
    )
    return DEV_PLACEHOLDERS
}

export const authEnv = resolve()
