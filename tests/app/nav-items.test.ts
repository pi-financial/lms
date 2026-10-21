/** @jest-environment node */
import { isActiveNavItem, visibleNavItems } from '@app/nav-items'
import { ROLE_EDITOR } from '@libs/auth/claims'

/**
 * Hiding a tab is presentation, not access control — the page re-checks, because a hidden link is
 * still a URL anyone can type. These tests cover the presentation half.
 */
describe('visibleNavItems', () => {
    it('shows learners the three learner tabs and no editor tabs', () => {
        const labels = visibleNavItems(['lms-learner']).map(i => i.href)
        expect(labels).toEqual(['/', '/courses', '/results'])
    })

    it('adds the editor tabs for the editor App role', () => {
        const labels = visibleNavItems([ROLE_EDITOR]).map(i => i.href)
        expect(labels).toContain('/editor')
        expect(labels).toContain('/report')
    })

    it('treats a missing roles claim as a learner', () => {
        expect(visibleNavItems(undefined).some(i => i.href === '/editor')).toBe(false)
    })
})

describe('isActiveNavItem', () => {
    /** A prefix match on `/` would light the dashboard up on every page in the app. */
    it('matches the dashboard only at the root', () => {
        expect(isActiveNavItem('/', '/')).toBe(true)
        expect(isActiveNavItem('/courses', '/')).toBe(false)
    })

    it('matches a route and its children', () => {
        expect(isActiveNavItem('/courses', '/courses')).toBe(true)
        expect(isActiveNavItem('/courses/aml-2026', '/courses')).toBe(true)
    })

    it('does not match a route that merely shares a prefix', () => {
        expect(isActiveNavItem('/courses-archive', '/courses')).toBe(false)
    })
})
