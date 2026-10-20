'use client'

import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { useState, useTransition } from 'react'
import {
    LOCALES,
    LOCALE_COOKIE,
    PREFERENCE_MAX_AGE,
    THEME_COOKIE,
    withLocale,
    type Locale,
    type Theme
} from '@libs/preferences/definitions'

/**
 * Theme and language switcher.
 *
 * Cookies are written here rather than through a Server Action on purpose: these are display
 * preferences, not server state, and a round-trip to set one would make the toggle feel broken.
 * `SameSite=Lax` and no `Secure` flag so it also works over plain HTTP in local development —
 * neither value is sensitive.
 *
 * The two switches then diverge, because what has to change differs:
 *
 * - **Theme** is purely CSS. Flipping `data-theme` on `<html>` re-resolves every palette variable
 *   instantly; no server round-trip, nothing to re-render.
 * - **Locale** is part of the URL, so switching it is a navigation. The cookie is still written so
 *   the proxy can send a returning visitor to the right prefix from `/`.
 */
function writeCookie(name: string, value: string) {
    document.cookie = `${name}=${value}; path=/; max-age=${PREFERENCE_MAX_AGE}; SameSite=Lax`
}

export function PreferencesSwitcher({ locale, theme }: { locale: Locale; theme: Theme }) {
    const router = useRouter()
    const pathname = usePathname()
    const searchParams = useSearchParams()
    const [isPending, startTransition] = useTransition()
    // Seeded from the server-rendered value, then owned by the client so the button label flips
    // immediately rather than waiting for a re-render that never comes.
    const [currentTheme, setCurrentTheme] = useState<Theme>(theme)

    function toggleTheme() {
        const next: Theme = currentTheme === 'light' ? 'dark' : 'light'
        setCurrentTheme(next)
        document.documentElement.dataset.theme = next
        writeCookie(THEME_COOKIE, next)
    }

    function changeLocale(next: Locale) {
        if (next === locale) return

        writeCookie(LOCALE_COOKIE, next)
        // Swap the prefix on the current path and keep the query string, so switching language on
        // a filtered page does not throw the filter away.
        const query = searchParams.toString()
        const target = withLocale(next, pathname) + (query ? `?${query}` : '')
        startTransition(() => router.push(target))
    }

    return (
        <div className="ml-auto flex items-center gap-4">
            <fieldset className="flex items-center gap-1">
                <legend className="sr-only">Language</legend>
                {LOCALES.map(value => (
                    <button
                        key={value}
                        type="button"
                        onClick={() => changeLocale(value)}
                        disabled={isPending}
                        aria-pressed={value === locale}
                        className={`rounded px-2 py-1 text-label-s-medium uppercase disabled:opacity-50 ${
                            value === locale ? 'bg-pi-mint-50 text-pi-mint-700' : 'text-grey-700 hover:bg-grey-100'
                        }`}
                    >
                        {value}
                    </button>
                ))}
            </fieldset>

            <button
                type="button"
                onClick={toggleTheme}
                aria-pressed={currentTheme === 'dark'}
                className="rounded px-2 py-1 text-body-m text-grey-700 hover:bg-grey-100"
            >
                {/* aria-pressed carries the state; the glyph is decorative. */}
                <span aria-hidden="true">{currentTheme === 'dark' ? '☀' : '☾'}</span>
                <span className="sr-only">Switch to {currentTheme === 'dark' ? 'light' : 'dark'} theme</span>
            </button>
        </div>
    )
}
