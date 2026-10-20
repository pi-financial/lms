'use client'

import { createClientLoggerWrapper } from '@pi-financial/pi-common-js/logger/client'

/**
 * Browser logger. Buffers entries in memory and POSTs them as OTLP JSON to `/api/telemetry/logs`
 * (the browser cannot reach the collector directly — CORS), flushing every 5s or every 100 entries.
 *
 * Nothing is sent until `initClientLogger` runs; that happens in `<TelemetryProvider>`.
 */
export const logger = createClientLoggerWrapper()

export {
    deinstrumentFetch,
    flushLogs,
    getActiveSpan,
    initClientLogger,
    instrumentFetch,
    setSpanUserAttributes
} from '@pi-financial/pi-common-js/logger/client'
