import { getLoggerConfig } from '@libs/logger/config'

/**
 * Next runs this once per runtime, before any application code. OpenTelemetry has to be set up
 * here — instrumentation patches modules at load time, so anything imported earlier is invisible
 * to it.
 */
export async function register() {
    if (process.env.NEXT_RUNTIME !== 'nodejs') return

    const { initOtelSdk } = await import('@pi-financial/pi-common-js/logger')
    await initOtelSdk(getLoggerConfig())

    // Order matters: pino must be loaded before next-logger patches Next's own logger.
    await import('pino')
    // @ts-expect-error next-logger ships no type definitions
    await import('next-logger')
}
