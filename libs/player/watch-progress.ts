/**
 * The no-skipping rule, as arithmetic.
 *
 * `furthest` is the whole model: playback advances it one second at a time, and a forward seek past
 * it is refused — so there is never a gap in what was watched, and no list of seen ranges to keep.
 * Rewinding is always allowed and never lowers the mark; watching something twice is not cheating.
 *
 * Pure and free of React or the YouTube API so the rule can be tested directly, which matters more
 * here than elsewhere: this is what a completion certificate ultimately rests on.
 */

/** How far a player may jump, and what to say when it may not. */
export type SeekVerdict = { allowed: true; to: number } | { allowed: false; furthest: number }

/**
 * Whether a seek to `target` is permitted.
 *
 * Backwards and up to the mark: yes. Past it: no — with one exception, an editor reviewing the
 * course, who is not being credited with anything and should not have to sit through it.
 *
 * `target` comes from a click on the progress bar, so it is clamped: a drag that ends past the
 * right edge should land on the end of the video, not somewhere beyond it.
 */
export function canSeek(target: number, furthest: number, duration: number, bypass = false): SeekVerdict {
    const to = Math.max(0, Math.min(target, duration))
    if (bypass || to <= furthest) return { allowed: true, to }
    return { allowed: false, furthest }
}

/**
 * The mark after a tick of playback.
 *
 * Only ever moves forward, and only to where playback actually reached — so a rewind leaves it
 * where it was, and the mark cannot be advanced by any means other than the video playing.
 */
export function advanceFurthest(furthest: number, position: number): number {
    return Math.max(furthest, position)
}

/**
 * The second at which an episode counts as watched.
 *
 * Floored, not rounded: the threshold is a share of the runtime, and the last partial second of
 * playback would otherwise keep a 100% rule permanently out of reach.
 */
export function watchTarget(duration: number, watchPercent: number): number {
    return Math.floor((duration * watchPercent) / 100)
}

/** Whether enough of the episode has been watched for it to complete. */
export function isWatched(furthest: number, duration: number, watchPercent: number): boolean {
    return duration > 0 && furthest >= watchTarget(duration, watchPercent)
}

/**
 * A jump large enough that playback cannot account for it.
 *
 * The player reports a position every few hundred milliseconds. Between two reports, honest
 * playback moves by about the elapsed wall-clock time; anything much larger is a seek — including
 * one this app did not initiate, such as a keyboard shortcut inside the iframe or the native
 * controls on a phone, neither of which fires an event we can intercept.
 *
 * The tolerance is generous on purpose. A tab that was throttled in the background, a stall while
 * the next segment buffers, or a slow frame all produce a step bigger than the interval, and
 * treating those as cheating would punish the honest case constantly. Catching the deliberate jump
 * — which moves by minutes — does not need a tight bound.
 */
export function isUnexplainedJump(previous: number, current: number, elapsedSeconds: number): boolean {
    return current - previous > elapsedSeconds + 2
}
