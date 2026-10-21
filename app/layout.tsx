import type { Metadata } from 'next'
import { getTheme } from '@libs/preferences/server'
import './globals.css'

export const metadata: Metadata = {
    title: {
        default: 'Pi E-Learning',
        template: '%s | Pi E-Learning'
    },
    description: 'ระบบอบรมพนักงาน Pi Financial'
}

/**
 * The document shell, for every route.
 *
 * It has to be here and not one level down. A URL matching no route at all — `/th` from an old
 * link, a typo — renders Next's not-found page against *this* layout, and a root layout that only
 * passed children through produced a document with no `<html>` and a runtime error instead of a
 * 404. A route group like `(app)` cannot stand in for it, because a group matches no URL segment
 * and so never sees those requests.
 *
 * What sits below is the part that genuinely differs: `(app)` adds the rail and the top bar for a
 * signed-in learner, `auth` adds neither, because nobody is signed in yet.
 *
 * `data-theme` is read from a cookie here, so the first byte of HTML already carries the right
 * colour and there is no flash before hydration.
 */
export default async function RootLayout({ children }: { children: React.ReactNode }) {
    const theme = await getTheme()

    return (
        // `h-dvh`, not `h-full`: `h-full` is a percentage of the STATIC viewport, so the moment a
        // mobile browser folds its address bar away the real viewport is taller than the shell and
        // the body's background shows through under the bottom bar. Learners reach this app from
        // phones, so that is the common case here, not the edge one.
        <html lang="th" data-theme={theme} className="h-dvh">
            <body className="min-h-dvh">{children}</body>
        </html>
    )
}
