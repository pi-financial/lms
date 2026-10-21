/**
 * Theme preference.
 *
 * Pure module — no `server-only`, no `'use client'` — because both sides need it: the layout reads
 * it on the server, the switcher in the browser.
 *
 * A cookie rather than `localStorage`, because the *server* has to read it: a `localStorage` theme
 * is known only after JavaScript runs, so the first paint is always the wrong colour and then
 * flips.
 *
 * There is no locale here. The app is Thai — every screen, every fixture, every string in the nav —
 * and a locale segment with one value in it is a prefix on every URL that buys nothing. If a second
 * language is ever needed, it comes back as a route segment (`/en/courses`) and not as a cookie:
 * content language changes what a page *contains*, so it has to be shareable, linkable and
 * crawlable, and a cookie would make one URL serve two different documents.
 */
export const THEMES = ['light', 'dark'] as const
export type Theme = (typeof THEMES)[number]
export const DEFAULT_THEME: Theme = 'light'
export const THEME_COOKIE = 'theme'

/** One year: a display preference has no reason to expire mid-session. */
export const PREFERENCE_MAX_AGE = 60 * 60 * 24 * 365

export function isTheme(value: string | undefined): value is Theme {
    return THEMES.includes(value as Theme)
}

/** Cookie values come from the client and are never trusted; anything unrecognised falls back. */
export function resolveTheme(value: string | undefined): Theme {
    return isTheme(value) ? value : DEFAULT_THEME
}
