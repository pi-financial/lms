/** @jest-environment node */
// Jest hoists jest.mock() above the imports, so the factory may only close over variables whose
// names start with `mock` — anything else would still be undefined when the factory runs.
const mockInternalV1UsersGet = jest.fn()

jest.mock('@pi-financial/user-srv-v2-client-axios', () => ({
    Configuration: jest.fn().mockImplementation((config: unknown) => config),
    UserApi: jest.fn().mockImplementation(() => ({ internalV1UsersGet: mockInternalV1UsersGet }))
}))

jest.mock('@libs/logger', () => ({
    logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() }
}))

import { findUsers } from '@libs/user/service'

describe('findUsers', () => {
    beforeEach(() => mockInternalV1UsersGet.mockReset())

    /**
     * The generated client takes filters positionally in an order that is neither alphabetical nor
     * the declaration order of `UserFilters`. A wrong slot searches the wrong column and still
     * returns 200, so this assertion is the one that would catch it.
     */
    it('passes filters in the generated positional order', async () => {
        mockInternalV1UsersGet.mockResolvedValue({ data: { data: [] } })

        await findUsers({
            accountId: '0900097',
            citizenId: 'C',
            email: 'e@x.com',
            firstName: 'First',
            ids: 'id-1',
            lastName: 'Last',
            phoneNumber: '0812345678'
        })

        expect(mockInternalV1UsersGet).toHaveBeenCalledWith(
            '0900097',
            'C',
            'e@x.com',
            'First',
            'id-1',
            'Last',
            '0812345678'
        )
    })

    it('sends accountId as the first argument and leaves the rest undefined', async () => {
        mockInternalV1UsersGet.mockResolvedValue({ data: { data: [] } })

        await findUsers({ accountId: '0900097' })

        expect(mockInternalV1UsersGet).toHaveBeenCalledWith(
            '0900097',
            undefined,
            undefined,
            undefined,
            undefined,
            undefined,
            undefined
        )
    })

    it('unwraps the { code, msg, data } envelope and maps to the domain type', async () => {
        mockInternalV1UsersGet.mockResolvedValue({
            data: { code: '0', msg: 'ok', data: [{ id: 'u1', firstnameEn: 'Somchai', lastnameEn: 'Jaidee' }] }
        })

        const users = await findUsers({ accountId: '0900097' })

        expect(users).toHaveLength(1)
        expect(users[0]).toMatchObject({ id: 'u1', nameEn: 'Somchai Jaidee' })
    })

    it('returns an empty list when the envelope has no data', async () => {
        mockInternalV1UsersGet.mockResolvedValue({ data: { code: '0', msg: 'ok' } })

        await expect(findUsers({ accountId: '0900097' })).resolves.toEqual([])
    })

    it('rethrows so the page can render an error state instead of an empty table', async () => {
        mockInternalV1UsersGet.mockRejectedValue(new Error('ECONNREFUSED'))

        await expect(findUsers({ accountId: '0900097' })).rejects.toThrow('ECONNREFUSED')
    })
})
