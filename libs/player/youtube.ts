/**
 * The slice of the YouTube IFrame Player API this app uses.
 *
 * Hand-written rather than pulled from `@types/youtube`: five methods and two events is the whole
 * surface, and a global `YT` namespace declared by a dependency is harder to see than one declared
 * here beside the code that depends on it.
 *
 * Loading the API is a side effect on `window` — the script appends a global and calls a global
 * callback — so it is wrapped in a promise that resolves once, and every player shares it.
 */

/** A player whose methods are attached and safe to call. */
export type YTPlayer = {
    playVideo(): void
    pauseVideo(): void
    seekTo(seconds: number, allowSeekAhead: boolean): void
    getCurrentTime(): number
    getDuration(): number
    destroy(): void
}

/**
 * What `new YT.Player()` actually hands back.
 *
 * It returns an object immediately, but it is a shell — the methods are attached only once the
 * iframe has loaded and `onReady` has fired. Calling one before then throws
 * `getCurrentTime is not a function` on every tick of a poll, which is a real bug this type exists
 * to make unrepresentable: hold a `YTPlayerHandle` until {@link isPlayerReady} narrows it.
 */
export type YTPlayerHandle = Partial<YTPlayer>

/** Whether the player has finished loading and its methods can be called. */
export function isPlayerReady(player: YTPlayerHandle | null): player is YTPlayer {
    return typeof player?.getCurrentTime === 'function'
}

/** The player states this app reacts to. YouTube's numbering, not ours. */
export const YT_PLAYING = 1
export const YT_PAUSED = 2
export const YT_ENDED = 0

type YTNamespace = {
    Player: new (
        element: HTMLElement | string,
        options: {
            videoId?: string
            host?: string
            playerVars?: Record<string, string | number>
            events?: {
                onReady?: (event: { target: YTPlayer }) => void
                onStateChange?: (event: { data: number; target: YTPlayer }) => void
            }
        }
    ) => YTPlayerHandle
}

/**
 * The embed options every course video is built with.
 *
 * `controls: 0` is the one that matters: YouTube's own bar cannot be told to refuse a seek, so the
 * page draws its own and this hides the one that would happily honour a drag. The rest close the
 * gaps that leaves — `disablekb` stops the arrow keys seeking inside the iframe, `fs: 0` keeps
 * fullscreen (where only YouTube's controls exist) out of reach, and `modestbranding` plus `rel: 0`
 * keep the end screen from offering unrelated videos.
 *
 * None of it is a security boundary. It makes the honest path the only easy one; the heartbeat
 * check on `lms-srv` is what a completion actually rests on.
 */
export const COURSE_PLAYER_VARS = {
    controls: 0,
    disablekb: 1,
    fs: 0,
    rel: 0,
    modestbranding: 1,
    playsinline: 1
} as const

/**
 * `youtube-nocookie.com` serves the same player without writing a tracking cookie before the
 * learner presses play. Passed as `host` so the API builds its iframe against it.
 */
export const NOCOOKIE_HOST = 'https://www.youtube-nocookie.com'

declare global {
    interface Window {
        YT?: YTNamespace
        onYouTubeIframeAPIReady?: () => void
    }
}

let apiPromise: Promise<YTNamespace> | undefined

/**
 * Loads the IFrame API once per page and resolves with the global it defines.
 *
 * The script fires `onYouTubeIframeAPIReady` when it is done, which is a single global callback —
 * so a second player must not overwrite it, and the promise is cached rather than the script
 * re-appended. A player that mounts after the API is already there resolves immediately.
 */
export function loadYouTubeApi(): Promise<YTNamespace> {
    if (typeof window === 'undefined') return Promise.reject(new Error('YouTube API is browser-only'))
    if (window.YT?.Player) return Promise.resolve(window.YT)
    if (apiPromise) return apiPromise

    apiPromise = new Promise<YTNamespace>((resolve, reject) => {
        window.onYouTubeIframeAPIReady = () => {
            if (window.YT?.Player) resolve(window.YT)
            else reject(new Error('YouTube API loaded without a Player constructor'))
        }

        const script = document.createElement('script')
        script.src = 'https://www.youtube.com/iframe_api'
        script.async = true
        script.addEventListener('error', () => {
            // Cleared so a later mount retries rather than awaiting a promise that never settles —
            // a blocked request here is usually a CSP rule or a network filter, both of which a
            // reload can fix.
            apiPromise = undefined
            reject(new Error('YouTube API failed to load'))
        })
        document.head.appendChild(script)
    })

    return apiPromise
}
