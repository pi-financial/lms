import { NextResponse } from 'next/server'
import { auth } from '@libs/auth/config'

/**
 * Auth guard. Next 16 renamed `middleware.ts` to `proxy.ts`.
 *
 * The sign-in page has to stay reachable without a session; everything else requires one.
 */
export const proxy = auth(request => {
    const { pathname } = request.nextUrl

    if (pathname.startsWith('/auth')) {
        // Already signed in: nothing to do on a sign-in page.
        if (request.auth) return NextResponse.redirect(new URL('/', request.nextUrl.origin))
        return NextResponse.next()
    }

    if (!request.auth) {
        const url = new URL('/auth/signin', request.nextUrl.origin)
        // Where to land after sign-in.
        url.searchParams.set('callbackUrl', pathname)
        return NextResponse.redirect(url)
    }

    return NextResponse.next()
})

export const config = {
    // Everything except API routes, Next's own assets and files with an extension. `/api/auth/*`
    // in particular must not be guarded — that is where the sign-in callback lands, and guarding it
    // would redirect the callback back to sign-in, forever.
    matcher: ['/((?!api|_next/static|_next/image|favicon.ico|images/|fonts/|.*\\..*).*)']
}
