import { proxyTelemetry } from '@pi-financial/pi-common-js/logger'
import { guardTelemetryRequest } from '../telemetry-guard'

export const dynamic = 'force-dynamic'

const MAX_BODY_BYTES = 64 * 1024
const LIMIT_PER_MINUTE = 20

export async function POST(request: Request) {
    const guard = await guardTelemetryRequest(request, 'logs', LIMIT_PER_MINUTE, MAX_BODY_BYTES)
    if (!guard.ok) return new Response(guard.message, { status: guard.status })

    const { status } = await proxyTelemetry(guard.body!, guard.endpoint!, MAX_BODY_BYTES)
    return new Response(null, { status })
}
