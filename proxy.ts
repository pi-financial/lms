import { NextResponse, type NextRequest } from 'next/server'
import { LOCALE_COOKIE, localeFromPath, resolveLocale, withLocale } from '@libs/preferences/definitions'

/**
 * Locale routing. Next 16 renamed `middleware.ts` to `proxy.ts`.
 *
 * Every page lives under `/[locale]`, so a request without a prefix has to gain one before it can
 * match a route. The preferred locale comes from the cookie the switcher writes, which is what
 * makes a returning visitor land back on the language they chose.
 *
 * This is a redirect rather than a rewrite: the address bar has to end up showing the real URL, or
 * the language switcher — which swaps the prefix in the current path — would have nothing to swap.
 */
export function proxy(request: NextRequest) {
    const { pathname } = request.nextUrl

    if (localeFromPath(pathname)) return NextResponse.next()

    const locale = resolveLocale(request.cookies.get(LOCALE_COOKIE)?.value)
    const url = request.nextUrl.clone()
    url.pathname = withLocale(locale, pathname)

    return NextResponse.redirect(url)
}

export const config = {
    // Everything except API routes, Next's own assets and files with an extension. `/api/telemetry`
    // in particular must not be redirected — the browser posts to it directly.
    matcher: ['/((?!api|_next/static|_next/image|favicon.ico|images/|fonts/|.*\\..*).*)']
}
