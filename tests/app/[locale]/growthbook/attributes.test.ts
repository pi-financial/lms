/** @jest-environment node */
import { parseAttributes } from '@app/[locale]/growthbook/attributes'

describe('parseAttributes', () => {
    it('returns an empty object when nothing is supplied — the anonymous case', () => {
        expect(parseAttributes({})).toEqual({})
    })

    it('reads every supported attribute', () => {
        expect(parseAttributes({ id: 'a', userId: 'u1', deviceId: 'd1' })).toEqual({
            id: 'a',
            userId: 'u1',
            deviceId: 'd1'
        })
    })

    /**
     * Attributes drive GrowthBook's targeting rules, so an unfiltered passthrough would let a
     * caller invent an attribute and — if a rule ever reads it — put themselves in a segment.
     */
    it('drops unknown attributes', () => {
        expect(parseAttributes({ userId: 'u1', isAdmin: 'true', country: 'TH' })).toEqual({ userId: 'u1' })
    })

    it('drops blank values and trims the rest', () => {
        expect(parseAttributes({ userId: '  u1  ', deviceId: '   ' })).toEqual({ userId: 'u1' })
    })
})
