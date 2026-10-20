/**
 * The route registry behind the header nav and the landing page, so the two cannot drift.
 *
 * Pure module, no `'use client'` and no server imports: both a Server Component and the client nav
 * read from it.
 */
export type NavItem = {
    /**
     * Locale-less path — the nav prefixes it with the active locale. Storing `/users` rather than
     * `/th/users` is what keeps the registry from needing one entry per language.
     *
     * For `external: true` items this is an absolute URL and is used verbatim.
     */
    href: string
    label: string
    description: string
    external?: boolean
}

export const NAV_ITEMS: NavItem[] = [
    {
        href: '/users?accountId=0900097',
        label: 'Users',
        description: 'client-lib → user-srv-v2, filtered on the server'
    },
    {
        href: '/growthbook',
        label: 'GrowthBook',
        description: 'flags evaluated server-side, results only to the browser'
    },
    {
        href: '/directus',
        label: 'Directus',
        description: 'CMS read, tag-cached, in the locale from the URL'
    },
    {
        href: 'http://pi-common-js.nonprod.pi.internal',
        label: 'Design tokens',
        description: 'pi-common-js showcase — the palette and typography this app renders from',
        external: true
    }
]

/**
 * Whether the current pathname belongs to a nav item.
 *
 * `pathname` is expected to have had its locale prefix stripped, so one entry matches every
 * language. The query string on the item is ignored: `/users?accountId=…` is still the Users page
 * once the user has changed the filter, and a plain equality check would drop the highlight the
 * moment they searched for anything.
 */
export function isActiveNavItem(pathname: string, href: string): boolean {
    const path = href.split('?')[0]
    return pathname === path || pathname.startsWith(`${path}/`)
}
