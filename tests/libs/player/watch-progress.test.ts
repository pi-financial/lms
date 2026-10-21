/** @jest-environment node */
import { advanceFurthest, canSeek, isUnexplainedJump, isWatched, watchTarget } from '@libs/player/watch-progress'

/**
 * The no-skipping rule. A completion certificate ultimately rests on these five functions, so they
 * are tested against the cases that would quietly give away a pass rather than only the happy path.
 */
describe('canSeek', () => {
    it('allows rewinding and replaying what was already watched', () => {
        expect(canSeek(0, 258, 760)).toEqual({ allowed: true, to: 0 })
        expect(canSeek(120, 258, 760)).toEqual({ allowed: true, to: 120 })
    })

    /** The boundary: the mark itself is reachable, the second after it is not. */
    it('allows seeking exactly to the mark and refuses one past it', () => {
        expect(canSeek(258, 258, 760)).toEqual({ allowed: true, to: 258 })
        expect(canSeek(259, 258, 760)).toEqual({ allowed: false, furthest: 258 })
    })

    it('refuses a jump to the end', () => {
        expect(canSeek(760, 258, 760)).toEqual({ allowed: false, furthest: 258 })
    })

    /** An editor is reviewing the course, not taking it, and is credited with nothing. */
    it('allows an editor anywhere', () => {
        expect(canSeek(760, 258, 760, true)).toEqual({ allowed: true, to: 760 })
    })

    it('clamps a target outside the video to its bounds', () => {
        // A drag ending past the right edge lands on the end, not beyond it.
        expect(canSeek(9999, 760, 760)).toEqual({ allowed: true, to: 760 })
        expect(canSeek(-50, 258, 760)).toEqual({ allowed: true, to: 0 })
    })

    /** Nothing is watched yet, so nothing but the start is reachable. */
    it('pins a fresh episode to zero', () => {
        expect(canSeek(1, 0, 760)).toEqual({ allowed: false, furthest: 0 })
        expect(canSeek(0, 0, 760)).toEqual({ allowed: true, to: 0 })
    })

    /**
     * Rewinding is unconditional, and this is the asymmetry the whole feature rests on: a learner
     * may go back as far as they like, as often as they like, and replay forward through anything
     * already watched. Only the ground past the mark is closed.
     *
     * Worth its own case because an earlier version enforced the rule by capping the slider at the
     * mark instead, which made forward seeks impossible *and* silently broke rewinding — the
     * control then spanned a different range than the bar drawn under it, so a click landed
     * nowhere near where it was aimed.
     */
    it('lets a learner rewind to the start and replay forward to the mark', () => {
        const mark = 258
        for (const target of [0, 1, 50, 120, 257, mark]) {
            expect(canSeek(target, mark, 3331)).toEqual({ allowed: true, to: target })
        }
        expect(canSeek(mark + 1, mark, 3331)).toEqual({ allowed: false, furthest: mark })
    })
})

describe('advanceFurthest', () => {
    it('moves the mark forward with playback', () => {
        expect(advanceFurthest(258, 259)).toBe(259)
    })

    /** The case the whole model depends on: rewinding must not cost a learner their progress. */
    it('never moves the mark backwards', () => {
        expect(advanceFurthest(258, 10)).toBe(258)
        expect(advanceFurthest(258, 258)).toBe(258)
    })
})

describe('watchTarget', () => {
    /**
     * Floored, not rounded. At 100% a rounded target would exceed the runtime by the last partial
     * second and the episode could never complete.
     */
    it('floors, so a 100% rule stays reachable', () => {
        expect(watchTarget(760, 100)).toBe(760)
        expect(watchTarget(761, 100)).toBe(761)
        expect(watchTarget(755, 80)).toBe(604)
    })
})

describe('isWatched', () => {
    it('completes at the threshold, not only at the end', () => {
        expect(isWatched(608, 760, 80)).toBe(true)
        expect(isWatched(607, 760, 80)).toBe(false)
    })

    /** A duration of zero means the player has not reported one yet — not that it is finished. */
    it('is false before the duration is known', () => {
        expect(isWatched(0, 0, 80)).toBe(false)
        expect(isWatched(500, 0, 80)).toBe(false)
    })
})

/**
 * The second guard. It catches a seek that bypassed the bar entirely — the keyboard shortcuts
 * inside the iframe, a phone's native controls — by comparing the step against the time that
 * actually elapsed.
 */
describe('isUnexplainedJump', () => {
    it('accepts ordinary playback', () => {
        expect(isUnexplainedJump(100, 100.5, 0.5)).toBe(false)
    })

    /** A throttled tab or a buffering stall overshoots; treating that as cheating punishes nobody
        but the honest learner, which is why the tolerance is generous. */
    it('accepts a stall or a throttled tab', () => {
        expect(isUnexplainedJump(100, 102, 0.5)).toBe(false)
        expect(isUnexplainedJump(100, 102.5, 0.5)).toBe(false)
    })

    it('catches a deliberate jump', () => {
        expect(isUnexplainedJump(100, 400, 0.5)).toBe(true)
        expect(isUnexplainedJump(100, 103, 0.5)).toBe(true)
    })

    /** Rewinding is always allowed, and must never be read as a jump. */
    it('ignores a backwards move', () => {
        expect(isUnexplainedJump(400, 100, 0.5)).toBe(false)
    })
})
