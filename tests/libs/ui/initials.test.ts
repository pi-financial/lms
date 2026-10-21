/** @jest-environment node */
import { initialsOf } from '@libs/ui/initials'

/** What a reader counts as one character, which is not what `String.length` counts. */
const graphemeCount = (text: string) =>
    Array.from(new Intl.Segmenter('th', { granularity: 'grapheme' }).segment(text)).length

/**
 * The avatar is the only place a name is abbreviated, and the names it abbreviates are Thai. A
 * `.slice(0, 2)` passes a test written against `Jane Doe` and renders a dotted circle for half
 * the company.
 */
describe('initialsOf', () => {
    it('takes one letter from each of the first two words', () => {
        expect(initialsOf('ธนกร วงศ์ประเสริฐ')).toBe('ธว')
        expect(initialsOf('Dev Editor')).toBe('DE')
    })

    /**
     * The case the grapheme split exists for: ก + ◌ุ is one written character, so `กุสุมา` gives
     * `กุ` and not a bare `ก`. The result is three code points and two glyphs — which is why the
     * length is asserted with a segmenter rather than with `.length`, a measure that would call
     * this a failure.
     */
    it('keeps a consonant and its vowel mark together', () => {
        const initials = initialsOf('กุสุมา ศรีสุข')
        expect(initials).toBe('กุศ')
        expect(graphemeCount(initials)).toBe(2)
    })

    it('falls back to the first two letters of a single word', () => {
        expect(initialsOf('Somchai')).toBe('So')
        // Two graphemes, four code points — the fallback counts the same way the split does.
        expect(graphemeCount(initialsOf('กุสุมา'))).toBe(2)
    })

    it('ignores extra whitespace and middle names', () => {
        expect(initialsOf('  ธนกร   วงศ์ประเสริฐ  จันทร์  ')).toBe('ธว')
    })

    /** An account with no name at all still has to draw something. */
    it('returns a placeholder for an empty name', () => {
        expect(initialsOf('')).toBe('?')
        expect(initialsOf('   ')).toBe('?')
    })

    /** A surrogate pair cut in half renders as a replacement glyph. */
    it('does not split an emoji', () => {
        expect(initialsOf('🎓')).toBe('🎓')
    })
})
