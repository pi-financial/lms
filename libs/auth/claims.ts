/**
 * Reading a Microsoft Entra ID token into the two things this app needs: who signed in, and what
 * they may do.
 *
 * Kept as a pure module with no next-auth import so it can be unit-tested against claim shapes
 * directly, which is the only way to be sure the email fallback holds.
 */

/**
 * Claims from the ID token.
 *
 * Entra returns the profile as the validated ID-token claims, so an App role assigned to this app
 * arrives in a flat `roles` array — the access token is Graph's and never carries them. `groups`
 * is present only when the tenant is configured to emit a group claim.
 */
export interface EntraClaims {
    /** App roles assigned to the signed-in account for this application. */
    roles?: string[]
    groups?: string[]
    email?: string
    preferred_username?: string
    upn?: string
}

/** App roles this application expects. */
export const ROLE_EDITOR = 'lms-editor'
export const ROLE_LEARNER = 'lms-learner'

/**
 * The email every enrolment, progress row, quiz attempt and certificate is keyed by.
 *
 * The claim is not guaranteed: Entra sends `email` only when the tenant is configured to, and an
 * account with no mailbox has none at all. Falling through `preferred_username` and `upn` is not
 * defensive tidiness — without it the value is `""`, and because it is the key, every learner
 * collapses onto a single row. That failure does not look like a broken login; it looks like one
 * person having taken every course.
 */
export function resolveEmail(claims: EntraClaims, fallback?: string | null): string | null {
    const candidate = claims.email ?? claims.preferred_username ?? claims.upn ?? fallback ?? ''
    const email = candidate.trim().toLowerCase()
    return email === '' ? null : email
}

/**
 * Every App role the token carries.
 *
 * Deduplicated: a role granted both directly and through a group assignment arrives twice, and a
 * caller counting entries would double it.
 */
export function collectRoles(claims: EntraClaims): string[] {
    return [...new Set(claims.roles ?? [])]
}

/** Whether the signed-in account holds the editor role. */
export function isEditor(roles: string[] | undefined): boolean {
    return (roles ?? []).includes(ROLE_EDITOR)
}
