/** @jest-environment node */
import { NAV_ITEMS, isActiveNavItem } from '@app/nav-items'

describe('isActiveNavItem', () => {
    it('matches the plain route', () => {
        expect(isActiveNavItem('/directus', '/directus')).toBe(true)
    })

    /**
     * The nav href carries a seed query string, and the users page rewrites it on every search.
     * A plain `href === pathname` check would drop the highlight as soon as anyone filtered.
     */
    it('ignores the query string on the nav item', () => {
        expect(isActiveNavItem('/users', '/users?accountId=0900097')).toBe(true)
    })

    it('matches nested routes', () => {
        expect(isActiveNavItem('/users/1115', '/users?accountId=0900097')).toBe(true)
    })

    it('does not match a different route', () => {
        expect(isActiveNavItem('/growthbook', '/directus')).toBe(false)
    })

    /** `/users` must not light up on `/users-archive`, which `startsWith` alone would do. */
    it('does not match a route that merely shares a prefix', () => {
        expect(isActiveNavItem('/users-archive', '/users?accountId=0900097')).toBe(false)
    })

    it('leaves the home route unhighlighted on a demo page', () => {
        expect(NAV_ITEMS.filter(item => !item.external).every(item => !isActiveNavItem('/', item.href))).toBe(true)
    })

    /** Internal hrefs are locale-less so one entry serves every language; the nav adds the prefix. */
    it('registers internal routes without a locale prefix', () => {
        const internal = NAV_ITEMS.filter(item => !item.external)
        expect(internal.every(item => item.href.startsWith('/'))).toBe(true)
        expect(internal.some(item => /^\/(th|en)\//.test(item.href))).toBe(false)
    })

    it('marks the pi-common-js showcase as external', () => {
        const showcase = NAV_ITEMS.find(item => item.href.includes('pi-common-js'))
        expect(showcase?.external).toBe(true)
    })
})
