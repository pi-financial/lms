/**
 * Console-backed logger for the Edge runtime (proxy.ts / middleware).
 *
 * The real server logger uses pino, which evaluates code dynamically — banned on Edge. This stub
 * keeps the call sites identical so moving a helper between runtimes does not mean rewriting it.
 */
export const logger = {
    debug: (msg: string, ...args: unknown[]) => console.log(`[DEBUG] ${msg}`, ...args),
    info: (msg: string, ...args: unknown[]) => console.log(`[INFO] ${msg}`, ...args),
    warn: (msg: string, ...args: unknown[]) => console.warn(`[WARN] ${msg}`, ...args),
    error: (msg: string, ...args: unknown[]) => console.error(`[ERROR] ${msg}`, ...args)
}
