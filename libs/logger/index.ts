import 'server-only'

import { createServerLogger } from '@pi-financial/pi-common-js/logger'
import { getLoggerConfig } from './config'

/**
 * Server logger: pino to stdout, and — when `logsEnabled` — a second stream that ships OTLP logs
 * to SigNoz. When traces are on, pino injects `trace_id`/`span_id` into every line so a log can be
 * clicked through to its trace.
 *
 * `import 'server-only'` is the guard rail: importing this from a Client Component fails the build
 * instead of dragging pino (and its dynamic `new Function` calls) into the browser bundle.
 * Client Components import `@libs/logger/client`; middleware imports `@libs/logger/edge`.
 */
export const logger = createServerLogger({
    ...getLoggerConfig(),
    isEdgeRuntime: process.env.NEXT_RUNTIME === 'edge'
})

export type { LoggerWrapper, UserContext } from '@pi-financial/pi-common-js/logger'
