import 'server-only'

import { cookies } from 'next/headers'
import { THEME_COOKIE, resolveTheme, type Theme } from './definitions'

/**
 * Reads the theme off the request, so the first byte of HTML already carries the right
 * `data-theme` and there is no flash of the wrong colour before hydration.
 *
 * Reading cookies opts a route into dynamic rendering. That is fine here — every screen behind the
 * sign-in is dynamic anyway, since it reads a session — but a statically prerendered page cannot
 * read them, so a theme-aware static page needs the attribute applied by a blocking inline script
 * instead.
 */
export async function getTheme(): Promise<Theme> {
    const store = await cookies()
    return resolveTheme(store.get(THEME_COOKIE)?.value)
}
