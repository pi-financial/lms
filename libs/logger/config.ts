import type { LoggerConfig } from '@pi-financial/pi-common-js/logger'

/**
 * The only place in the app that reads SigNoz environment variables.
 *
 * `@pi-financial/pi-common-js/logger` deliberately reads no `process.env` — every factory takes a
 * plain config object — so this adapter is where Next-specific env naming lives. Keep it that way:
 * if the vars are renamed, this is the single file to touch.
 */
export function getLoggerConfig(): LoggerConfig {
    return {
        serviceName: process.env.NEXT_PUBLIC_SIGNOZ_SERVICE_NAME || 'Pi.NextjsBoilerplate.UI',
        environment: getEnvironment(),
        isLocal: process.env.NODE_ENV !== 'production',
        logsEnabled: process.env.NEXT_PUBLIC_SIGNOZ_LOG_ENABLED === 'true',
        tracesEnabled: process.env.NEXT_PUBLIC_SIGNOZ_TRACE_ENABLED === 'true',
        autoInstrumentEnabled: process.env.NEXT_PUBLIC_SIGNOZ_AUTO_INSTRUMENT === 'true',
        // Server-only: the browser never learns the collector address, it posts to
        // /api/telemetry/* instead (see app/api/telemetry).
        otlpEndpoint: process.env.SIGNOZ_OTLP_ENDPOINT ?? '',
        logsEndpoint: process.env.SIGNOZ_LOGS_ENDPOINT ?? ''
    }
}

/**
 * Resolves the deployment environment, always capitalised: `Development`, `Staging`, `Production`.
 *
 * SigNoz treats `deployment.environment` as an opaque string, so `staging` and `Staging` become two
 * separate values in every filter and dashboard. Normalising here — rather than trusting each
 * `.env` file and each CI variable to agree — is what keeps that from happening.
 *
 * Prefers the explicit deployment env and falls back to NODE_ENV, which is lower-case by
 * definition.
 */
export function getEnvironment(): string {
    const raw = process.env.NEXT_PUBLIC_DEPLOYMENT_ENV?.trim() || process.env.NODE_ENV || 'development'
    return raw.charAt(0).toUpperCase() + raw.slice(1)
}
