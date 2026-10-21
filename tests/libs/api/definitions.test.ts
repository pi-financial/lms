/** @jest-environment node */
import { categoryCounts, isUnlocked, youtubeVideoId, formatDuration } from '@libs/api/definitions'
import type { Course, Episode } from '@libs/api/definitions'

const course = (id: string, category: Course['category']): Course => ({
    id,
    title: id,
    category,
    version: 'v1',
    outline: '1 EP',
    status: 'not-started',
    progress: 0,
    certificate: true,
    art: { from: '#000', to: '#111', ink: '#fff', icon: 'video' }
})

const episode = (id: string, done: boolean): Episode => ({ id, title: id, kind: 'video', done })

describe('categoryCounts', () => {
    it('counts each category and the total', () => {
        const counts = categoryCounts([course('a', 'Bond'), course('b', 'Bond'), course('c', 'Compliance')])

        expect(counts.all).toBe(3)
        expect(counts.Bond).toBe(2)
        expect(counts.Compliance).toBe(1)
    })

    /** A chip for an empty category still renders, and `undefined` would print as nothing. */
    it('leaves an unused category absent rather than at a wrong number', () => {
        expect(categoryCounts([course('a', 'Bond')])['Mutual Fund']).toBeUndefined()
    })
})

/**
 * The gate that makes a completion mean something. It is re-checked on the server for every
 * request — the rail refusing to draw a link is presentation, and a URL is still typeable.
 */
describe('isUnlocked', () => {
    const episodes = [episode('1', true), episode('2', false), episode('3', false)]

    it('always opens the first episode', () => {
        expect(isUnlocked([episode('1', false)], 0)).toBe(true)
    })

    it('opens an episode whose predecessor is done', () => {
        expect(isUnlocked(episodes, 1)).toBe(true)
    })

    it('keeps an episode closed while its predecessor is unfinished', () => {
        expect(isUnlocked(episodes, 2)).toBe(false)
    })

    /** An editor reviewing EP 3 cannot be made to sit through EP 1–2 to see it render. */
    it('opens everything for an editor', () => {
        expect(isUnlocked(episodes, 2, true)).toBe(true)
    })

    /** An `?ep=` pointing past the end must not resolve to an open episode. */
    it('treats an out-of-range index as closed', () => {
        expect(isUnlocked(episodes, 99)).toBe(false)
    })
})

/**
 * The value reaches an iframe `src`, so what this rejects matters more than what it accepts: an
 * editor pastes a URL, and anything that is not a YouTube video id must not be embedded.
 */
describe('youtubeVideoId', () => {
    const ID = 'I_oMJk6barY'

    it('accepts a watch URL', () => {
        expect(youtubeVideoId('https://www.youtube.com/watch?v=I_oMJk6barY')).toBe(ID)
    })

    it('accepts a short link and an already-embedded URL', () => {
        expect(youtubeVideoId('https://youtu.be/I_oMJk6barY')).toBe(ID)
        expect(youtubeVideoId('https://www.youtube.com/embed/I_oMJk6barY')).toBe(ID)
    })

    it('rejects another host, even one whose URL carries a valid-looking id', () => {
        expect(youtubeVideoId('https://evil.example.com/watch?v=I_oMJk6barY')).toBeNull()
        // The lookalike an allowlist written with `includes` would wave through.
        expect(youtubeVideoId('https://youtube.com.evil.example/watch?v=I_oMJk6barY')).toBeNull()
    })

    it('rejects a URL with no usable video id', () => {
        expect(youtubeVideoId('https://www.youtube.com/')).toBeNull()
        expect(youtubeVideoId('https://www.youtube.com/watch?v=../../etc/passwd')).toBeNull()
        expect(youtubeVideoId('not a url')).toBeNull()
        expect(youtubeVideoId(undefined)).toBeNull()
    })
})

describe('formatDuration', () => {
    it('pads the seconds so a column of times lines up', () => {
        expect(formatDuration(258)).toBe('4:18')
        expect(formatDuration(540)).toBe('9:00')
        expect(formatDuration(5)).toBe('0:05')
        expect(formatDuration(0)).toBe('0:00')
    })
})
