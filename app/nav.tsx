'use client'

import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { stripLocale, withLocale, type Locale, type Theme } from '@libs/preferences/definitions'
import { NAV_ITEMS, isActiveNavItem } from './nav-items'
import { PreferencesSwitcher } from './preferences-switcher'

/**
 * Header nav.
 *
 * A Client Component only because highlighting the current route needs `usePathname`, which has no
 * server equivalent — the server does not know the URL a layout is rendering under. It holds no
 * state and fetches nothing; the links themselves are ordinary `next/link` navigations.
 */
export function Nav({ locale, theme }: { locale: Locale; theme: Theme }) {
    const pathname = usePathname()
    // Compared without the prefix so one registry entry matches every language.
    const path = stripLocale(pathname)

    return (
        <header className="border-b border-grey-200">
            <nav aria-label="Main" className="mx-auto flex max-w-6xl items-center gap-6 px-6 py-4">
                <Link
                    href={withLocale(locale, '/')}
                    className="flex items-center gap-2 text-subh-m font-semibold text-pi-mint-700"
                >
                    {/*
                     * `unoptimized` because the source is already a vector: running an SVG through
                     * the image optimizer buys nothing and would require `dangerouslyAllowSVG` in
                     * next.config, which relaxes the rule for *every* optimized SVG — and SVGs can
                     * carry scripts.
                     */}
                    <Image src="/images/logo.svg" alt="" width={24} height={29} priority unoptimized />
                    Boilerplate
                </Link>

                <ul className="flex items-center gap-1">
                    {NAV_ITEMS.map(item => {
                        const active = !item.external && isActiveNavItem(path, item.href)

                        return (
                            <li key={item.href}>
                                <Link
                                    href={item.external ? item.href : withLocale(locale, item.href)}
                                    // `noreferrer` implies `noopener`; both matter for a
                                    // `target="_blank"` link to another origin.
                                    target={item.external ? '_blank' : undefined}
                                    rel={item.external ? 'noreferrer' : undefined}
                                    aria-current={active ? 'page' : undefined}
                                    className={`rounded px-3 py-2 text-body-m ${
                                        active
                                            ? 'bg-pi-mint-50 font-medium text-pi-mint-700'
                                            : 'text-grey-700 hover:bg-grey-100'
                                    }`}
                                >
                                    {item.label}
                                    {item.external ? <span aria-hidden="true"> ↗</span> : null}
                                    {item.external ? <span className="sr-only"> (opens in a new tab)</span> : null}
                                </Link>
                            </li>
                        )
                    })}
                </ul>

                <PreferencesSwitcher locale={locale} theme={theme} />
            </nav>
        </header>
    )
}
