'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { Lock, Pause, Play } from 'lucide-react'
import { formatDuration } from '@libs/api/definitions'
import { advanceFurthest, canSeek, isUnexplainedJump, isWatched, watchTarget } from '@libs/player/watch-progress'
import {
    COURSE_PLAYER_VARS,
    isPlayerReady,
    loadYouTubeApi,
    NOCOOKIE_HOST,
    YT_ENDED,
    YT_PLAYING,
    type YTPlayerHandle
} from '@libs/player/youtube'
import { cn } from '@libs/ui/cn'

/** How often the position is read back from the player. */
const TICK_MS = 500

/**
 * How close the player has to get to a requested position before the seek counts as landed.
 *
 * A second's slack rather than an exact match: the player resumes at the nearest keyframe, and if
 * it was already playing it will have moved on by a tick before the next poll reads it.
 */
const SEEK_SETTLE_SECONDS = 1.5

/**
 * A YouTube video that cannot be skipped forward.
 *
 * YouTube's own controls are off (`controls=0`) and the bar below is ours, because the embedded
 * controls cannot be told to refuse a seek — the furthest they go is reporting one after it has
 * happened. With our bar, a click past the mark never becomes a seek at all.
 *
 * Two guards, because turning the controls off is not the same as making them unreachable:
 *
 * 1. **The bar refuses the seek.** A click at or below `furthest` seeks; past it, nothing moves and
 *    the bar says why.
 * 2. **The poll catches a jump that happened anyway.** The keyboard shortcuts inside the iframe,
 *    the native controls a phone draws over it, and the YouTube app a learner may be bounced into
 *    all move the position without touching our bar. Each poll compares the step against the
 *    elapsed time and seeks back when the two cannot be reconciled.
 *
 * What this is not: proof. Someone who opens the video on youtube.com, or who calls `seekTo` from
 * a console, is outside anything a page can enforce. The guarantee a certificate rests on is the
 * server's — `lms-srv` checks heartbeats against real elapsed time — and this is what makes the
 * honest path the easy one and produces the beats that check reads.
 *
 * TODO(lms-srv): report `furthest` through `postBeat` so the mark survives a reload. Until then it
 * starts from what the service last recorded and is lost when the page unmounts.
 */
export function VideoPlayer({
    videoId,
    title,
    initialWatched,
    watchPercent,
    bypass
}: {
    videoId: string
    title: string
    /** Furthest second already credited, from `lms-srv`. */
    initialWatched: number
    watchPercent: number
    /** An editor reviewing the course — seeks freely, and is credited with nothing. */
    bypass: boolean
}) {
    const hostRef = useRef<HTMLDivElement>(null)
    const playerRef = useRef<YTPlayerHandle | null>(null)

    // The authoritative mark, kept in a ref as well as in state: the poll runs on an interval and
    // must read the current value, not the one captured when the effect was created.
    const furthestRef = useRef(initialWatched)
    const lastTickRef = useRef(initialWatched)
    /**
     * Where a seek this app initiated is heading, while the player catches up.
     *
     * `seekTo` is asynchronous: for a tick or two afterwards `getCurrentTime()` still reports the
     * old position. Without this, rewinding to 0:50 from 4:18 reads as a 208-second forward jump
     * on the very next poll, and the guard "corrects" the learner's own rewind back to the mark.
     */
    const pendingSeekRef = useRef<number | null>(null)

    const [furthest, setFurthest] = useState(initialWatched)
    const [position, setPosition] = useState(initialWatched)
    const [duration, setDuration] = useState(0)
    const [playing, setPlaying] = useState(false)
    const [ready, setReady] = useState(false)
    const [failed, setFailed] = useState(false)
    const [refusedAt, setRefusedAt] = useState<number | null>(null)

    useEffect(() => {
        let cancelled = false
        let timer: ReturnType<typeof setInterval> | undefined

        loadYouTubeApi()
            .then(YT => {
                if (cancelled || !hostRef.current) return

                const player = new YT.Player(hostRef.current, {
                    videoId,
                    host: NOCOOKIE_HOST,
                    playerVars: COURSE_PLAYER_VARS,
                    events: {
                        onReady: ({ target }) => {
                            if (cancelled) return
                            playerRef.current = target
                            setDuration(target.getDuration())
                            // Resume where the service left off rather than at zero — `allowSeekAhead`
                            // is true because this is the credited position, not a skip past it.
                            if (initialWatched > 0) {
                                target.seekTo(initialWatched, true)
                                pendingSeekRef.current = initialWatched
                                lastTickRef.current = initialWatched
                            }
                            setReady(true)
                        },
                        onStateChange: ({ data }) => {
                            if (cancelled) return
                            setPlaying(data === YT_PLAYING)
                            if (data === YT_ENDED) setPlaying(false)
                        }
                    }
                })

                timer = setInterval(() => {
                    const current = playerRef.current
                    // `isPlayerReady`, not a null check: the constructor returns an object
                    // immediately, but its methods only exist once `onReady` has fired — polling
                    // before that throws `getCurrentTime is not a function` on every tick.
                    if (!isPlayerReady(current)) return

                    const now = current.getCurrentTime()
                    const pending = pendingSeekRef.current

                    // A seek this app asked for is still settling. Nothing to police: the target
                    // was already checked by `canSeek`, and the position in between is the player
                    // catching up, not a jump.
                    if (pending != null) {
                        // Landed — or close enough that playback has taken over from the seek.
                        if (Math.abs(now - pending) <= SEEK_SETTLE_SECONDS) pendingSeekRef.current = null
                        lastTickRef.current = now
                        setPosition(now)
                        return
                    }

                    const previous = lastTickRef.current
                    lastTickRef.current = now

                    // A step bigger than the interval can explain: something seeked without going
                    // through our bar. Put it back, unless an editor is looking.
                    if (!bypass && previous > 0 && isUnexplainedJump(previous, now, TICK_MS / 1000)) {
                        current.seekTo(furthestRef.current, true)
                        pendingSeekRef.current = furthestRef.current
                        lastTickRef.current = furthestRef.current
                        setPosition(furthestRef.current)
                        setRefusedAt(Date.now())
                        return
                    }

                    setPosition(now)
                    // The mark follows playback and nothing else, so an editor scrubbing to 9:00 to
                    // check a slide is never credited with having watched up to 9:00.
                    if (!bypass) {
                        const next = advanceFurthest(furthestRef.current, now)
                        if (next !== furthestRef.current) {
                            furthestRef.current = next
                            setFurthest(next)
                        }
                    }
                }, TICK_MS)

                playerRef.current = player
            })
            .catch(() => {
                if (!cancelled) setFailed(true)
            })

        return () => {
            cancelled = true
            if (timer) clearInterval(timer)
            // `destroy` is one of the methods that only exists after `onReady`.
            playerRef.current?.destroy?.()
            playerRef.current = null
        }
        // Mount-only: re-running would tear down the player mid-watch. `initialWatched` is the
        // value the service recorded for this episode, and the episode changes by navigation.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    /**
     * Move to `target`, or refuse.
     *
     * The range cannot express a value past the mark, so a refusal here means the request came from
     * somewhere else — the keyboard shortcuts inside the iframe, a phone's native controls — and
     * `canSeek` is still the one place that decides.
     */
    const seekTo = useCallback(
        (target: number) => {
            const player = playerRef.current
            if (!isPlayerReady(player) || duration <= 0) return

            const verdict = canSeek(target, furthestRef.current, duration, bypass)
            if (!verdict.allowed) {
                // Shown as a message beside the bar, not as a tally: a learner who mis-clicks does
                // not need a running count of their mistakes. The service records the rejection.
                setRefusedAt(Date.now())
                return
            }

            player.seekTo(verdict.to, true)
            pendingSeekRef.current = verdict.to
            lastTickRef.current = verdict.to
            setPosition(verdict.to)
        },
        [bypass, duration]
    )

    const toggle = useCallback(() => {
        const player = playerRef.current
        if (!isPlayerReady(player)) return
        if (playing) player.pauseVideo()
        else player.playVideo()
    }, [playing])

    // The refusal message clears itself; a notice that stays on screen stops being read.
    useEffect(() => {
        if (refusedAt == null) return
        const timer = setTimeout(() => setRefusedAt(null), 3200)
        return () => clearTimeout(timer)
    }, [refusedAt])

    const watched = isWatched(furthest, duration, watchPercent)
    const target = duration > 0 ? watchTarget(duration, watchPercent) : 0
    const pct = (seconds: number) => (duration > 0 ? Math.min(100, (seconds / duration) * 100) : 0)

    return (
        <div className="overflow-hidden rounded-xl border border-line bg-panel shadow-(--shadow-panel)">
            <div className="relative aspect-video w-full bg-[#12282E]">
                {/* The API replaces this node with the iframe it builds. */}
                <div ref={hostRef} className="size-full" />

                {failed ? (
                    <p className="absolute inset-0 grid place-items-center px-6 text-center text-body-s text-white/70">
                        โหลดวิดีโอไม่สำเร็จ — ลองรีโหลดหน้านี้อีกครั้ง
                    </p>
                ) : null}
            </div>

            <div className="flex flex-wrap items-center gap-3 border-t border-line px-4 py-3">
                <button
                    type="button"
                    onClick={toggle}
                    disabled={!ready}
                    aria-label={playing ? 'หยุดชั่วคราว' : 'เล่น'}
                    className="grid size-8 shrink-0 place-items-center rounded-lg bg-earned text-white disabled:opacity-40"
                >
                    {playing ? <Pause className="size-3.5" /> : <Play className="size-3.5" />}
                </button>

                <span className="font-rubik tnum shrink-0 text-label-s-regular text-ink-2">
                    {formatDuration(position)}
                </span>

                {/*
                 * The bar, and the thesis of the screen: the earned region is solid, the rest is
                 * inert hatching rather than "not yet coloured" — it is not a part of the video the
                 * learner is free to jump into.
                 *
                 * A real `<input type="range">`, visually hidden over the drawn track. A range is
                 * what a browser already knows how to announce, focus and drive from the keyboard,
                 * and reimplementing that on a div means reimplementing all of it — which is how a
                 * player ends up unusable without a mouse. `max` is the mark rather than the
                 * duration, so the control cannot express a position past it: dragging to the right
                 * edge lands exactly on the furthest second watched, and there is no value to
                 * refuse. Everything visible is drawn below and the input is transparent.
                 */}
                <div className="relative h-6 min-w-45 flex-1">
                    <div className="pointer-events-none absolute inset-x-0 top-1/2 h-1.5 -translate-y-1/2 overflow-hidden rounded-full bg-panel-2">
                        {/* Hatching over the whole track; the fill covers the earned part of it. */}
                        <div
                            aria-hidden
                            className="absolute inset-0 text-ink-3 opacity-30"
                            style={{
                                background: 'repeating-linear-gradient(135deg, transparent 0 5px, currentColor 5px 6px)'
                            }}
                        />
                        <div
                            aria-hidden
                            className="absolute inset-y-0 left-0 rounded-full bg-earned"
                            style={{ width: `${pct(position)}%` }}
                        />
                    </div>

                    {/* Where the gate sits. Hidden once the whole video is unlocked, when it would
                        mark nothing, and for an editor, who has no gate. */}
                    {!bypass && furthest < duration ? (
                        <div
                            aria-hidden
                            className="pointer-events-none absolute top-1/2 h-3 w-0.5 -translate-y-1/2 rounded-full bg-ink-3"
                            style={{ left: `${pct(furthest)}%` }}
                        />
                    ) : null}

                    <div
                        aria-hidden
                        className="pointer-events-none absolute top-1/2 size-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-earned bg-panel"
                        style={{ left: `${pct(position)}%` }}
                    />

                    {/*
                     * The input spans the WHOLE video, not just the watched part.
                     *
                     * Capping `max` at the mark looked like the tidy way to make a forward seek
                     * impossible, and it broke the control: the input was then laid over a bar
                     * drawn across the full runtime, so the two used different scales — the
                     * invisible thumb sat at 100% while the playhead was drawn at 8%, and clicking
                     * where the playhead appeared seeked somewhere else entirely. Rewinding "worked"
                     * only in the sense that it moved; it never moved where the learner aimed.
                     *
                     * So the geometry stays honest and `canSeek` does the refusing. Backwards is
                     * always granted, forwards past the mark never is.
                     */}
                    <input
                        type="range"
                        min={0}
                        max={Math.floor(duration)}
                        step={1}
                        value={Math.floor(position)}
                        onChange={event => seekTo(Number(event.target.value))}
                        disabled={!ready || duration <= 0}
                        aria-label={`ตำแหน่งในวิดีโอ ${title}`}
                        aria-valuetext={`${formatDuration(position)} จาก ${formatDuration(duration)}${
                            bypass || furthest >= duration ? '' : ` · กรอไปข้างหน้าได้ถึง ${formatDuration(furthest)}`
                        }`}
                        // Transparent and full-bleed: the visuals above are the control's appearance,
                        // and the native track would otherwise draw a second bar through them.
                        className="absolute inset-0 size-full cursor-pointer appearance-none bg-transparent focus-visible:outline-none [&::-moz-range-thumb]:size-3 [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:bg-transparent [&::-webkit-slider-thumb]:size-3 [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:bg-transparent"
                    />
                </div>

                <span className="font-rubik tnum shrink-0 text-label-s-regular text-ink-2">
                    {formatDuration(duration)}
                </span>
            </div>

            {/* `<output>`: a live region by default, so a refusal is announced when it appears
                rather than only shown. */}
            <output
                className={cn(
                    'flex items-center gap-2 border-t border-line-soft px-4 py-2.5 text-label-s-regular',
                    refusedAt != null ? 'text-locked' : 'text-ink-3'
                )}
            >
                {refusedAt != null ? (
                    <>
                        <Lock className="size-3 shrink-0" />
                        ข้ามไปข้างหน้าไม่ได้ — ดูได้ถึง {formatDuration(furthest)} เท่านั้น
                    </>
                ) : bypass ? (
                    'Editor — กรอได้อิสระ และไม่บันทึกความคืบหน้า'
                ) : watched ? (
                    `ดูครบ ${watchPercent}% แล้ว — ตอนนี้ผ่าน กรอดูซ้ำได้ตามต้องการ`
                ) : (
                    `ต้องดูอย่างน้อย ${watchPercent}% (${formatDuration(target)}) · ย้อนกลับได้ไม่จำกัด`
                )}
            </output>
        </div>
    )
}
