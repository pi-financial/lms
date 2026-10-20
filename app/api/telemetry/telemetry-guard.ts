import 'server-only'

import { getLoggerConfig } from '@libs/logger/config'

/**
 * These routes are the browser's only way to reach SigNoz, so they are an unauthenticated POST
 * endpoint that forwards a body to an internal host. Two things keep that safe here:
 * a per-IP rate limit and a hard body cap.
 *
 * TODO(auth): this boilerplate ships without a session layer. Once you add one, require a session
 * here as well — otherwise anyone who can reach the app can push arbitrary log lines into your
 * observability stack. See `app/api/telemetry/telemetry-guard.ts` in pi-trading-web for the
 * session-checking version.
 */
const WINDOW_MS = 60_000

const buckets = new Map<string, { count: number; resetAt: number }>()

export type GuardResult = { ok: true } | { ok: false; status: number; message: string }

function clientKey(request: Request): string {
    const forwarded = request.headers.get('x-forwarded-for')
    return forwarded?.split(',')[0]?.trim() || request.headers.get('x-real-ip') || 'unknown'
}

function rateLimit(key: string, limitPerMinute: number): boolean {
    const now = Date.now()
    const bucket = buckets.get(key)

    if (!bucket || now >= bucket.resetAt) {
        buckets.set(key, { count: 1, resetAt: now + WINDOW_MS })
        return true
    }
    if (bucket.count >= limitPerMinute) return false

    bucket.count += 1
    return true
}

/**
 * Runs every check a telemetry route needs and returns the body to forward.
 *
 * Returns 503 rather than 404 when telemetry is disabled: the route exists, it just has nowhere to
 * forward to, and the client SDK treats 503 as "retry later" instead of "stop trying".
 */
export async function guardTelemetryRequest(
    request: Request,
    kind: 'logs' | 'traces',
    limitPerMinute: number,
    maxBodyBytes: number
): Promise<GuardResult & { body?: string; endpoint?: string }> {
    const config = getLoggerConfig()
    const enabled = kind === 'logs' ? config.logsEnabled : config.tracesEnabled
    const endpoint = kind === 'logs' ? config.logsEndpoint : config.otlpEndpoint

    if (!enabled) return { ok: false, status: 503, message: `${kind} telemetry disabled` }
    if (!endpoint) return { ok: false, status: 503, message: `${kind} endpoint not configured` }

    if (!rateLimit(`${kind}:${clientKey(request)}`, limitPerMinute)) {
        return { ok: false, status: 429, message: 'too many requests' }
    }

    const body = await request.text()
    // Checked before forwarding as well as inside proxyTelemetry: a 20MB body should never make it
    // as far as an outbound request.
    if (Buffer.byteLength(body, 'utf8') > maxBodyBytes) {
        return { ok: false, status: 413, message: 'payload too large' }
    }

    return { ok: true, body, endpoint }
}
