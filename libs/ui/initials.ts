/**
 * The one or two characters an avatar draws when there is no photograph.
 *
 * One letter from each of the first two words — `กุสุมา ศรีสุข` → `กษ` — falling back to the first
 * two letters when the name is a single word.
 *
 * Graphemes, not code points: `กุ` is ก plus a combining vowel, and a `slice` over the string keeps
 * the consonant and drops the mark, or keeps a lone mark that the browser renders on a dotted
 * circle. `Intl.Segmenter` is what knows where one written character ends — and the same call fixes
 * emoji and other surrogate pairs, which a `.slice(0, 2)` would cut in half.
 *
 * Pure module so it can be tested against real names directly; the avatar itself is a client
 * component with nothing worth asserting.
 */
export function initialsOf(name: string): string {
    const words = name.trim().split(/\s+/).filter(Boolean)
    if (words.length === 0) return '?'
    if (words.length === 1) return graphemes(words[0]).slice(0, 2).join('')

    return words
        .slice(0, 2)
        .map(word => graphemes(word)[0] ?? '')
        .join('')
}

function graphemes(text: string): string[] {
    return Array.from(new Intl.Segmenter('th', { granularity: 'grapheme' }).segment(text), s => s.segment)
}
