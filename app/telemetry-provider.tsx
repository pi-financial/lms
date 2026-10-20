'use client'

import { useEffect } from 'react'
import { deinstrumentFetch, flushLogs, initClientLogger, instrumentFetch } from '@libs/logger/client'

/**
 * Starts browser-side telemetry: traces around every `fetch`, and buffered logs.
 *
 * Both are posted to `/api/telemetry/*` rather than to SigNoz directly — the collector sets no CORS
 * headers, and routing through the app keeps its address off the public internet.
 *
 * The flush handlers matter more than they look. A user closing the tab is exactly when you most
 * want the buffered logs, and `beforeunload` alone is unreliable on mobile Safari, which may never
 * fire it; `visibilitychange` is the one event you can count on.
 */
type TelemetryConfig = {
    serviceName: string
    environment: string
    isLocal: boolean
    logsEnabled: boolean
    tracesEnabled: boolean
}

const EXCLUDED_FETCH_URLS = ['/api/telemetry/', '/_next/']

export function TelemetryProvider({ config }: { config: TelemetryConfig }) {
    const { serviceName, environment, isLocal, logsEnabled, tracesEnabled } = config

    useEffect(() => {
        if (!logsEnabled && !tracesEnabled) return

        if (tracesEnabled) {
            instrumentFetch({
                tracesEnabled,
                serviceName,
                environment,
                tracesProxyPath: '/api/telemetry/traces',
                // Instrumenting the telemetry endpoints themselves would make every span produce
                // another span.
                excludedUrls: EXCLUDED_FETCH_URLS
            })
        }

        const destroyLogger = logsEnabled
            ? initClientLogger({
                  serviceName,
                  environment,
                  isLocal,
                  logsEnabled,
                  logsProxyPath: '/api/telemetry/logs'
              })
            : undefined

        const flushOnHide = () => {
            if (document.visibilityState === 'hidden') void flushLogs()
        }
        document.addEventListener('visibilitychange', flushOnHide)
        window.addEventListener('beforeunload', flushOnHide)

        return () => {
            document.removeEventListener('visibilitychange', flushOnHide)
            window.removeEventListener('beforeunload', flushOnHide)
            if (tracesEnabled) deinstrumentFetch()
            destroyLogger?.()
        }
    }, [serviceName, environment, isLocal, logsEnabled, tracesEnabled])

    return null
}
