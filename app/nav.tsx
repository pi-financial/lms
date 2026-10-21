'use client'

import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { BookOpen, ClipboardCheck, LayoutGrid, LogOut, PenLine, Users, type LucideIcon } from 'lucide-react'
import type { Theme } from '@libs/preferences/definitions'
import { signOutAction } from '@libs/auth/actions'
import { cn } from '@libs/ui/cn'
import { initialsOf } from '@libs/ui/initials'
import { isActiveNavItem, type NavIcon, type NavItem } from './nav-items'
import { PreferencesSwitcher } from './preferences-switcher'
import { useTrail } from './trail'

/**
 * Icon names back to components.
 *
 * The registry travels from the server as plain data, so the components are resolved here, in the
 * bundle that already contains them.
 */
const ICONS: Record<NavIcon, LucideIcon> = {
    dashboard: LayoutGrid,
    courses: BookOpen,
    results: ClipboardCheck,
    editor: PenLine,
    report: Users
}

export type Account = { name: string; email: string; isEditor: boolean }

/**
 * The side rail: brand, then the tabs grouped by what they are for.
 *
 * A rail rather than a top strip because the editor tabs are a second group with its own heading,
 * and a horizontal bar has nowhere to put one — the five tabs then read as a flat list where two
 * of them are only visible to some people and nothing says why.
 *
 * Hidden below `lg`, where `MobileNav` takes over; the two share this item list so a tab can only
 * be added in one place.
 */
export function Rail({ items, account }: { items: NavItem[]; account: Account }) {
    const path = usePathname()
    const learnerItems = items.filter(item => !item.role)
    const editorItems = items.filter(item => item.role)

    return (
        <nav
            aria-label="หลัก"
            className="hidden w-58 shrink-0 flex-col gap-1 border-r border-line bg-panel px-3 py-5 lg:flex"
        >
            <Link href="/" className="mb-4 flex items-center gap-2.5 px-2.5 text-sub-hl font-medium text-ink">
                {/* `unoptimized`: the source is already a vector, so the optimizer buys nothing and
                    would need `dangerouslyAllowSVG`, which relaxes the rule for every optimized
                    SVG — and SVGs can carry scripts. */}
                <Image src="/images/logo.svg" alt="" width={22} height={26} priority unoptimized />
                E-Learning
            </Link>

            <RailGroup label="เรียน" items={learnerItems} path={path} />
            {editorItems.length > 0 ? <RailGroup label="จัดการเนื้อหา" items={editorItems} path={path} /> : null}

            <div className="mt-auto border-t border-line-soft pt-3">
                <div className="flex items-center gap-2.5 px-2.5 py-1">
                    <Avatar name={account.name} />
                    <div className="min-w-0">
                        <div className="truncate text-label-s-medium text-ink">{account.name}</div>
                        <div className="text-label-xs-regular text-ink-3">
                            {account.isEditor ? 'Editor' : 'Learner'}
                        </div>
                    </div>
                </div>
            </div>
        </nav>
    )
}

function RailGroup({ label, items, path }: { label: string; items: NavItem[]; path: string }) {
    return (
        <>
            <div className="px-2.5 pt-3.5 pb-1.5 font-rubik text-label-xs-regular tracking-[0.14em] text-ink-3 uppercase">
                {label}
            </div>
            <ul className="flex flex-col gap-0.5">
                {items.map(item => {
                    const active = isActiveNavItem(path, item.href)
                    const Icon = ICONS[item.icon]

                    return (
                        <li key={item.href}>
                            <Link
                                href={item.href}
                                aria-current={active ? 'page' : undefined}
                                className={cn(
                                    'flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-body-m transition-colors',
                                    active
                                        ? 'bg-earned-soft font-medium text-earned-ink'
                                        : 'text-ink-2 hover:bg-panel-2'
                                )}
                            >
                                <Icon className="size-4 shrink-0 opacity-85" aria-hidden />
                                {item.label}
                            </Link>
                        </li>
                    )
                })}
            </ul>
        </>
    )
}

/**
 * The tabs again, as a scrolling strip, for screens too narrow for the rail.
 *
 * The two groups collapse into one row here: a heading per group costs a line of vertical space
 * that a phone does not have, and with the tabs side by side the grouping was only ever telling
 * the reader something the icons already do.
 */
export function MobileNav({ items }: { items: NavItem[] }) {
    const path = usePathname()

    return (
        <nav aria-label="หลัก" className="border-b border-line bg-panel lg:hidden">
            <ul className="flex items-center gap-1 overflow-x-auto px-3 py-2">
                {items.map(item => {
                    const active = isActiveNavItem(path, item.href)
                    const Icon = ICONS[item.icon]

                    return (
                        <li key={item.href}>
                            <Link
                                href={item.href}
                                aria-current={active ? 'page' : undefined}
                                className={cn(
                                    'flex items-center gap-2 rounded-lg px-3 py-2 text-body-m whitespace-nowrap',
                                    active ? 'bg-earned-soft font-medium text-earned-ink' : 'text-ink-2'
                                )}
                            >
                                <Icon className="size-4 shrink-0" aria-hidden />
                                {item.label}
                            </Link>
                        </li>
                    )
                })}
            </ul>
        </nav>
    )
}

/**
 * The bar above the page: where you are, and the controls that are not page content.
 *
 * Sticky, because the rail scrolls away on a long course list and this line is the only thing left
 * saying which screen this is.
 *
 * The section comes from the same registry the tabs do rather than from each page: a page that
 * knew its own section would be free to disagree with the tab that is highlighted.
 */
export function TopBar({ theme, items, account }: { theme: Theme; items: NavItem[]; account: Account }) {
    const path = usePathname()
    const section = items.find(item => isActiveNavItem(path, item.href))
    // Set by whichever page is open, through `SetTrail` — see `app/trail.tsx` for why it travels
    // this way rather than as a prop.
    const trail = useTrail()

    return (
        <header className="sticky top-0 z-20 flex items-center gap-4 border-b border-line bg-panel px-5 py-3 sm:px-7">
            {/*
             * Section, then what is open inside it. A detail page showing only "คอร์สทั้งหมด"
             * named the tab rather than the page — and repeated the back link two lines below it
             * while saying nothing about where the reader actually is.
             *
             * The section hides on a narrow screen: with both competing for one line, the trail is
             * the half worth keeping.
             */}
            <div className="flex min-w-0 items-center gap-1.5 text-label-m-medium">
                <span className={cn('truncate', trail ? 'hidden text-ink-3 sm:inline' : 'text-ink')}>
                    {section?.label ?? 'Pi E-Learning'}
                </span>
                {trail ? (
                    <>
                        <span aria-hidden className="hidden text-ink-3 sm:inline">
                            /
                        </span>
                        <span className="truncate text-ink">{trail}</span>
                    </>
                ) : null}
            </div>

            <div className="ml-auto flex shrink-0 items-center gap-2">
                <PreferencesSwitcher theme={theme} />

                <div className="hidden items-center gap-2.5 lg:flex">
                    <Avatar name={account.name} />
                    <div className="text-left">
                        <div className="text-label-s-medium text-ink">{account.name}</div>
                        <div className="text-label-xs-regular text-ink-3">
                            {account.isEditor ? 'Editor' : 'Learner'}
                        </div>
                    </div>
                </div>

                {/* A form, not an onClick: signing out is a server action, and a POST is what
                    keeps it off a link a browser might prefetch. */}
                <form action={signOutAction}>
                    <button
                        type="submit"
                        aria-label="ออกจากระบบ"
                        title="ออกจากระบบ"
                        className="rounded-lg p-2 text-ink-3 hover:bg-panel-2 hover:text-ink"
                    >
                        <LogOut className="size-4" aria-hidden />
                    </button>
                </form>
            </div>
        </header>
    )
}

/** Initials on a disc, for an account with no photograph. */
function Avatar({ name }: { name: string }) {
    const initials = initialsOf(name)

    return (
        <span
            aria-hidden
            className="grid size-8 shrink-0 place-items-center rounded-full bg-earned text-label-xs-medium text-white"
        >
            {initials}
        </span>
    )
}
