/**
 * The tab registry behind the app shell.
 *
 * Pure module — no `'use client'`, no server imports — because both the server layout and the
 * client tab bar read from it, and a second copy of this list is how the two come to disagree.
 *
 * Mirrors `pi-elearning/mock/index.html`. Every screen here is a placeholder: the data behind them
 * belongs to `lms-srv`, which does not exist yet.
 */
import { ROLE_EDITOR } from '@libs/auth/claims'

/**
 * Which icon a tab draws.
 *
 * A name, not the component. This list is built on the server and handed to the client nav as
 * props, and a React component is a function — React refuses to serialise one across that
 * boundary. The client maps the name back to the component it already has in its own bundle.
 */
export type NavIcon = 'dashboard' | 'courses' | 'results' | 'editor' | 'report'

export type NavItem = {
    /** Locale-less path — the shell prefixes it with the active locale. */
    href: string
    label: string
    icon: NavIcon
    /**
     * App role required to see the tab. Absent means every signed-in learner.
     *
     * Hiding the tab is presentation, not access control: the page itself re-checks, because a
     * hidden link is still a URL anyone can type.
     */
    role?: string
}

export const NAV_ITEMS: NavItem[] = [
    { href: '/', label: 'แดชบอร์ด', icon: 'dashboard' },
    { href: '/courses', label: 'คอร์สทั้งหมด', icon: 'courses' },
    { href: '/results', label: 'ผลสอบและใบรับรอง', icon: 'results' },
    { href: '/editor', label: 'สร้างคอร์ส', icon: 'editor', role: ROLE_EDITOR },
    { href: '/report', label: 'ความคืบหน้าทีม', icon: 'report', role: ROLE_EDITOR }
]

/** The tabs this account may see. */
export function visibleNavItems(roles: string[] | undefined): NavItem[] {
    const held = roles ?? []
    return NAV_ITEMS.filter(item => !item.role || held.includes(item.role))
}

/**
 * Whether a nav item owns the current path.
 *
 * `pathname` is expected to be locale-free. `/` is matched exactly — a prefix match would mark the
 * dashboard active on every page in the app.
 */
export function isActiveNavItem(pathname: string, href: string): boolean {
    if (href === '/') return pathname === '/'
    return pathname === href || pathname.startsWith(`${href}/`)
}
