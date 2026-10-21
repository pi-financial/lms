import { GrowthBookAppProvider } from '@libs/growthbook/provider'
import { getEvaluatedFeatures } from '@libs/growthbook/server'
import { getLoggerConfig } from '@libs/logger/config'
import { getTheme } from '@libs/preferences/server'
import { auth } from '@libs/auth/config'
import { AuthSessionProvider } from '@libs/auth/session-provider'
import { isEditor } from '@libs/auth/claims'
import { MobileNav, Rail, TopBar } from '../nav'
import { visibleNavItems } from '../nav-items'
import { TelemetryProvider } from '../telemetry-provider'
import { TrailProvider } from '../trail'

/**
 * The signed-in shell: rail, top bar, and the column the page scrolls in.
 *
 * `(app)` is a route group — it brackets every signed-in screen under one layout without putting a
 * segment in the URL, so the dashboard is `/` and a course is `/courses/aml-2026`. The sign-in
 * screens are outside it, because they need neither the rail nor a session.
 *
 * `<html>` and `<body>` belong to the root layout, not here: a URL matching no route renders
 * against the root, and a group never sees those requests.
 *
 * A Server Component, like every layout and page in this app unless it has a concrete reason not
 * to be. The client components below are leaves — one wires up browser telemetry, one holds a
 * context, one switches the theme. None of them fetches.
 *
 * `GrowthBookAppProvider` wraps a tree that reads no flag yet, and is kept on purpose: it is the
 * wiring, not a user of it. Flags are evaluated here on the server and handed down as plain data,
 * so adding one is a `FeatureKey` entry plus a `useFeatureIsOn` at the leaf that needs it —
 * targeting rules never leave the cluster and the first render is already correct. With
 * `GROWTHBOOK_KEY` unset every flag reads as its default, which is the state this app is in today.
 */
export default async function AppLayout({ children }: { children: React.ReactNode }) {
    // The proxy has already refused anyone without a session, so this is a read, not a check.
    const [features, theme, session] = await Promise.all([getEvaluatedFeatures(), getTheme(), auth()])
    const { serviceName, environment, isLocal, logsEnabled, tracesEnabled } = getLoggerConfig()

    const account = {
        name: session?.user?.name ?? session?.user?.email ?? '',
        email: session?.user?.email ?? '',
        isEditor: isEditor(session?.roles)
    }
    const items = visibleNavItems(session?.roles)

    return (
        <>
            <TelemetryProvider config={{ serviceName, environment, isLocal, logsEnabled, tracesEnabled }} />
            <AuthSessionProvider session={session}>
                <GrowthBookAppProvider initialFeatures={features}>
                    <TrailProvider>
                        {/* The rail is a sibling of the scrolling column, not a child of it, so it
                        stays put while a long course list scrolls past. */}
                        <div className="flex min-h-dvh">
                            <Rail items={items} account={account} />

                            {/* `min-w-0`: without it a flex child refuses to shrink below its content,
                            and one wide table makes the whole page scroll sideways. */}
                            <div className="flex min-w-0 flex-1 flex-col">
                                <TopBar theme={theme} items={items} account={account} />
                                <MobileNav items={items} />
                                {/*
                                 * Two things, and the first is what was wrong: `mx-auto`. Without it
                                 * the leftover width all piles up on the right and the page reads as
                                 * though it failed to fill.
                                 *
                                 * And a cap of 1600 rather than 1120. 1120 plus the 232px rail leaves a
                                 * 1512px laptop — the common one here — with 160px of dead space that
                                 * the content would have used: these screens are card grids that
                                 * auto-fill and a rail-plus-pane split, not columns of prose, so width
                                 * buys another card per row rather than an unreadable line length. The
                                 * cap still catches a 2560px monitor, where a progress row really would
                                 * run too far for the eye to track.
                                 */}
                                <main className="mx-auto w-full max-w-[1600px] px-5 py-7 sm:px-7">{children}</main>
                            </div>
                        </div>
                    </TrailProvider>
                </GrowthBookAppProvider>
            </AuthSessionProvider>
        </>
    )
}
