import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { GrowthBookAppProvider } from '@libs/growthbook/provider'
import { getEvaluatedFeatures } from '@libs/growthbook/server'
import { getLoggerConfig } from '@libs/logger/config'
import { LOCALES, isLocale } from '@libs/preferences/definitions'
import { getTheme } from '@libs/preferences/server'
import { Nav } from '../nav'
import { TelemetryProvider } from '../telemetry-provider'
import '../globals.css'

export const metadata: Metadata = {
    title: 'Pi Next.js Boilerplate',
    description: 'Starter template for Pi Next.js applications'
}

/** Tells Next the set of valid prefixes, and 404s anything else rather than rendering a broken page. */
export function generateStaticParams() {
    return LOCALES.map(locale => ({ locale }))
}

/**
 * Locale layout — a Server Component, like every layout and page in this app unless it has a
 * concrete reason not to be.
 *
 * The document shell lives here rather than in the root layout so `lang` can carry the locale from
 * the route. `data-theme` comes from a cookie, so the first paint is already the right colour.
 *
 * Feature flags are evaluated here, on the server, and handed down as plain data. The client
 * components below are leaves: one wires up browser telemetry, one holds a context, one switches
 * preferences. None of them fetches.
 */
export default async function LocaleLayout({
    children,
    params
}: {
    children: React.ReactNode
    params: Promise<{ locale: string }>
}) {
    const { locale } = await params
    // The segment matches any string, so an unknown prefix would otherwise render the whole app
    // under a bogus `lang`.
    if (!isLocale(locale)) notFound()

    const [features, theme] = await Promise.all([getEvaluatedFeatures(), getTheme()])
    const { serviceName, environment, isLocal, logsEnabled, tracesEnabled } = getLoggerConfig()

    return (
        <html lang={locale} data-theme={theme}>
            <body className="min-h-screen">
                <TelemetryProvider config={{ serviceName, environment, isLocal, logsEnabled, tracesEnabled }} />
                <GrowthBookAppProvider initialFeatures={features}>
                    <Nav locale={locale} theme={theme} />
                    {children}
                </GrowthBookAppProvider>
            </body>
        </html>
    )
}
