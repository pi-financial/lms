'use client'

import { useState } from 'react'
import { Moon, Sun } from 'lucide-react'
import { PREFERENCE_MAX_AGE, THEME_COOKIE, type Theme } from '@libs/preferences/definitions'

/**
 * Light/dark toggle.
 *
 * The cookie is written here rather than through a Server Action on purpose: this is a display
 * preference, not server state, and a round-trip to set one would make the toggle feel broken.
 * Flipping `data-theme` on `<html>` re-resolves every palette variable instantly — no re-render,
 * nothing to fetch.
 *
 * `SameSite=Lax` and no `Secure` flag so it also works over plain HTTP in local development; the
 * value is the word `light` or `dark` and is not sensitive.
 */
export function PreferencesSwitcher({ theme }: { theme: Theme }) {
    // Seeded from the server-rendered value, then owned by the client so the icon flips
    // immediately rather than waiting for a re-render that never comes.
    const [current, setCurrent] = useState<Theme>(theme)

    function toggle() {
        const next: Theme = current === 'light' ? 'dark' : 'light'
        setCurrent(next)
        document.documentElement.dataset.theme = next
        document.cookie = `${THEME_COOKIE}=${next}; path=/; max-age=${PREFERENCE_MAX_AGE}; SameSite=Lax`
    }

    return (
        <button
            type="button"
            onClick={toggle}
            aria-pressed={current === 'dark'}
            className="rounded-lg p-2 text-ink-3 hover:bg-panel-2 hover:text-ink"
        >
            {/* aria-pressed carries the state; the icon is decorative. */}
            {current === 'dark' ? <Sun className="size-4" aria-hidden /> : <Moon className="size-4" aria-hidden />}
            <span className="sr-only">{current === 'dark' ? 'ใช้ธีมสว่าง' : 'ใช้ธีมมืด'}</span>
        </button>
    )
}
