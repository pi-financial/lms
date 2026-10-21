/** @jest-environment node */
import { parseFilters } from '@app/(app)/users/filters'

describe('parseFilters', () => {
    it('defaults to the demo account when nothing is supplied', () => {
        expect(parseFilters({})).toEqual({ accountId: '0900097' })
    })

    it('reads every supported filter', () => {
        expect(
            parseFilters({
                accountId: '0900097',
                email: 'a@b.com',
                firstName: 'Somchai',
                lastName: 'Jaidee',
                phoneNumber: '0812345678',
                citizenId: '123',
                ids: 'u1,u2'
            })
        ).toEqual({
            accountId: '0900097',
            email: 'a@b.com',
            firstName: 'Somchai',
            lastName: 'Jaidee',
            phoneNumber: '0812345678',
            citizenId: '123',
            ids: 'u1,u2'
        })
    })

    /**
     * This is the allow-list that stops an arbitrary POST body reaching the service, since
     * `searchUsersAction` is a public endpoint — not just cosmetic query-string tidying.
     */
    it('drops unknown keys', () => {
        expect(parseFilters({ utm_source: 'slack', role: 'admin', accountId: '0900097' })).toEqual({
            accountId: '0900097'
        })
    })

    it('drops blank values instead of sending `?email=`, which would match nothing', () => {
        expect(parseFilters({ accountId: '0900097', email: '   ' })).toEqual({ accountId: '0900097' })
    })

    it('trims surrounding whitespace', () => {
        expect(parseFilters({ accountId: '  0900097  ' })).toEqual({ accountId: '0900097' })
    })

    it('takes the first value when a param is repeated', () => {
        expect(parseFilters({ accountId: ['0900097', '0900098'] })).toEqual({ accountId: '0900097' })
    })
})
