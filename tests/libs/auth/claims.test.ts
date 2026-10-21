/** @jest-environment node */
import { collectRoles, isEditor, resolveEmail, ROLE_EDITOR } from '@libs/auth/claims'

/**
 * `employee_email` keys every enrolment, progress row, quiz attempt and certificate. Entra sends
 * `email` only when the tenant is configured to — so the fallback chain is not tidiness, it is
 * what stops every learner collapsing onto one row when a claim is absent.
 */
describe('resolveEmail', () => {
    it('prefers the email claim', () => {
        expect(resolveEmail({ email: 'a@pi.co.th', preferred_username: 'b@pi.co.th' })).toBe('a@pi.co.th')
    })

    it('falls back to preferred_username when the tenant sends no email claim', () => {
        expect(resolveEmail({ preferred_username: 'b@pi.co.th' })).toBe('b@pi.co.th')
    })

    it('falls back to upn when neither is present', () => {
        expect(resolveEmail({ upn: 'c@pi.co.th' })).toBe('c@pi.co.th')
    })

    it('falls back to the token email last', () => {
        expect(resolveEmail({}, 'd@pi.co.th')).toBe('d@pi.co.th')
    })

    it('lower-cases and trims, so one person is one row', () => {
        expect(resolveEmail({ email: '  A.Person@PI.co.th ' })).toBe('a.person@pi.co.th')
    })

    /**
     * The case this whole function exists for. Returning `''` would be persisted as a key and
     * every learner would share it; `null` cannot be written by accident.
     */
    it('returns null rather than an empty string when nothing resolves', () => {
        expect(resolveEmail({})).toBeNull()
        expect(resolveEmail({ email: '   ' })).toBeNull()
        expect(resolveEmail({}, '')).toBeNull()
        expect(resolveEmail({}, null)).toBeNull()
    })
})

describe('isEditor', () => {
    it('is true only for the editor App role', () => {
        expect(isEditor([ROLE_EDITOR])).toBe(true)
        expect(isEditor(['lms-learner'])).toBe(false)
    })

    it('treats a missing roles claim as no roles', () => {
        expect(isEditor(undefined)).toBe(false)
        expect(isEditor([])).toBe(false)
    })
})

/**
 * Entra sends App roles as a flat `roles` claim on the ID token. The access token is Graph's and
 * never carries them, so this claim is the only place a role arrives.
 */
describe('collectRoles', () => {
    it('reads the flat roles claim', () => {
        expect(collectRoles({ roles: ['lms-editor'] })).toEqual(['lms-editor'])
    })

    /** A role granted both directly and through a group assignment arrives twice. */
    it('deduplicates', () => {
        expect(collectRoles({ roles: ['lms-learner', 'lms-learner', 'lms-editor'] })).toEqual([
            'lms-learner',
            'lms-editor'
        ])
    })

    /** An account assigned to no App role signs in; it just reaches nothing behind the guard. */
    it('treats a token with no role claim as no roles', () => {
        expect(collectRoles({})).toEqual([])
    })
})
