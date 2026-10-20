/**
 * Theme and locale preferences.
 *
 * Pure module — no `server-only`, no `'use client'` — because both sides need it: the layout and
 * the proxy read it on the server, the switcher in the browser.
 *
 * The two are stored differently, on purpose:
 *
 * - **Locale lives in the path** (`/th/directus`). It changes what the page *contains*, so it has
 *   to be shareable, linkable and crawlable — a cookie would make one URL serve two different
 *   documents, which breaks links, caches and search engines alike. A cookie still records the
 *   preference so `/` can redirect a returning visitor to the right prefix.
 * - **Theme lives in a cookie**, because it changes only how the same document looks. It is a
 *   cookie rather than `localStorage` so the *server* can read it: a `localStorage` theme is known
 *   only after JavaScript runs, so the first paint is always the wrong colour and then flips.
 */
export const LOCALES = ['th', 'en'] as const
export type Locale = (typeof LOCALES)[number]
export const DEFAULT_LOCALE: Locale = 'th'
/** Next's conventional name, so a future `next-intl` migration finds the value already there. */
export const LOCALE_COOKIE = 'NEXT_LOCALE'

export const THEMES = ['light', 'dark'] as const
export type Theme = (typeof THEMES)[number]
export const DEFAULT_THEME: Theme = 'light'
export const THEME_COOKIE = 'theme'

/** One year: a display preference has no reason to expire mid-session. */
export const PREFERENCE_MAX_AGE = 60 * 60 * 24 * 365

export function isLocale(value: string | undefined): value is Locale {
    return LOCALES.includes(value as Locale)
}

export function isTheme(value: string | undefined): value is Theme {
    return THEMES.includes(value as Theme)
}

/** Cookie values come from the client and are never trusted; anything unrecognised falls back. */
export function resolveLocale(value: string | undefined): Locale {
    return isLocale(value) ? value : DEFAULT_LOCALE
}

export function resolveTheme(value: string | undefined): Theme {
    return isTheme(value) ? value : DEFAULT_THEME
}

/** The locale prefix of a pathname, or undefined when it has none. */
export function localeFromPath(pathname: string): Locale | undefined {
    const first = pathname.split('/')[1]
    return isLocale(first) ? first : undefined
}

/** `/th/directus` → `/directus`. Returns `/` for a bare prefix so the result is always a valid path. */
export function stripLocale(pathname: string): string {
    const locale = localeFromPath(pathname)
    if (!locale) return pathname

    const rest = pathname.slice(`/${locale}`.length)
    return rest || '/'
}

/** `('en', '/directus')` → `/en/directus`. Idempotent: an already-prefixed path is re-prefixed correctly. */
export function withLocale(locale: Locale, pathname: string): string {
    const path = stripLocale(pathname)
    return path === '/' ? `/${locale}` : `/${locale}${path}`
}
