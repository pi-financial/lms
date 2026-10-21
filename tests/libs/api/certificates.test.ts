/** @jest-environment node */
import { certificateFor, certificatesFor } from '@libs/api/fixtures'

/**
 * A certificate belongs to a person, and the page that renders one is reachable only by its
 * holder. These two lookups are where that rule starts — the page turns a missing certificate into
 * a 404, so a lookup that was too generous would hand one learner another's document.
 */
describe('certificatesFor', () => {
    it('returns what this learner holds', () => {
        const held = certificatesFor('dev.learner@pi.co.th')

        expect(held).toHaveLength(3)
        expect(held.every(certificate => certificate.holderEmail === 'dev.learner@pi.co.th')).toBe(true)
    })

    /** Holding none is an ordinary state, not an error — most learners hold none for most courses. */
    it('returns nothing for a learner who holds none', () => {
        expect(certificatesFor('dev.editor@pi.co.th')).toEqual([])
    })

    it('returns nothing for an unknown or absent email', () => {
        expect(certificatesFor('someone.else@pi.co.th')).toEqual([])
        expect(certificatesFor(undefined)).toEqual([])
        expect(certificatesFor('')).toEqual([])
    })

    /** Entra may send the address in any case; the key must not depend on which. */
    it('matches regardless of case', () => {
        expect(certificatesFor('Dev.Learner@PI.co.th')).toHaveLength(3)
    })
})

describe('certificateFor', () => {
    it('finds the certificate for a course this learner passed', () => {
        const certificate = certificateFor('dev.learner@pi.co.th', 'aml-2026')

        expect(certificate?.id).toBe('PI-AML-2026-0147')
        expect(certificate?.courseId).toBe('aml-2026')
    })

    /** The case the 404 rests on: a real course, a real learner, no certificate between them. */
    it('returns nothing for a course this learner has not passed', () => {
        expect(certificateFor('dev.learner@pi.co.th', 'bond-basics')).toBeUndefined()
    })

    /** One learner must never reach another's document by guessing the course id. */
    it('does not return another learner’s certificate', () => {
        expect(certificateFor('dev.editor@pi.co.th', 'aml-2026')).toBeUndefined()
        expect(certificateFor(undefined, 'aml-2026')).toBeUndefined()
    })

    it('returns nothing for a course that does not exist', () => {
        expect(certificateFor('dev.learner@pi.co.th', 'no-such-course')).toBeUndefined()
    })

    /** An expired certificate is still held: the record stands, only its validity lapsed. */
    it('still returns an expired certificate', () => {
        const certificate = certificateFor('dev.learner@pi.co.th', 'staff-trading')

        expect(certificate?.expired).toBe(true)
        expect(certificate?.id).toBe('PI-STAFF-2025-0455')
    })
})
