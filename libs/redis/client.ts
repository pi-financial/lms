import 'server-only'
import { createClient, type RedisClientType } from 'redis'

/**
 * Redis — connected lazily, and only if a URL is configured.
 *
 * Nothing in the app requires it yet. It is wired up now because the two things it will be needed
 * for are already in the design: the watch heartbeat writes a progress row every few seconds per
 * learner, and a quiz attempt holds a shuffled question order that must survive a reload without
 * being re-derived. Both want a store that is cheap to write and allowed to lose data.
 *
 * Absent `REDIS_URL`, every call returns null and the caller falls through to its own source. That
 * is deliberate: a cache that takes the app down when it is missing is worse than no cache.
 */

let client: RedisClientType | null = null
let connecting: Promise<RedisClientType | null> | null = null

export function redisConfigured(): boolean {
    return Boolean(process.env.REDIS_URL)
}

export async function getRedis(): Promise<RedisClientType | null> {
    if (!redisConfigured()) return null
    if (client?.isReady) return client
    // Concurrent callers during startup share one connect rather than opening a socket each.
    if (connecting) return connecting

    connecting = (async () => {
        try {
            const c: RedisClientType = createClient({ url: process.env.REDIS_URL })
            // Without a listener, a connection error after connect() is an unhandled 'error' event,
            // which takes the Node process down — the opposite of degrading gracefully.
            c.on('error', err => console.error('[redis]', err))
            await c.connect()
            client = c
            return c
        } catch (err) {
            console.error('[redis] connect failed, continuing without cache', err)
            client = null
            return null
        } finally {
            connecting = null
        }
    })()

    return connecting
}
