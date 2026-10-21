/** @jest-environment node */
const mockFindUsers = jest.fn()
jest.mock('@libs/user/service', () => ({ findUsers: (...args: unknown[]) => mockFindUsers(...args) }))
jest.mock('@libs/logger', () => ({
    logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() }
}))

import { searchUsersAction } from '@app/(app)/users/action'

describe('searchUsersAction', () => {
    it('parses its input before calling the service', async () => {
        mockFindUsers.mockResolvedValue([])

        // A Server Action is a public POST endpoint, so the argument is untrusted: `role` must not
        // survive, and `email` must not be forwarded as an empty filter.
        await searchUsersAction({ accountId: '0900097', role: 'admin', email: '  ' })

        expect(mockFindUsers).toHaveBeenCalledWith({ accountId: '0900097' })
    })

    it('returns the users on success', async () => {
        mockFindUsers.mockResolvedValue([{ id: 'u1', nameEn: 'Somchai Jaidee' }])

        await expect(searchUsersAction({ accountId: '0900097' })).resolves.toEqual({
            ok: true,
            users: [{ id: 'u1', nameEn: 'Somchai Jaidee' }]
        })
    })

    /**
     * A rejected Server Action reaches the client as a generic redacted message, so the failure is
     * returned as data instead — that is what lets the page show something specific.
     */
    it('returns the failure instead of throwing', async () => {
        mockFindUsers.mockRejectedValue(new Error('connect ECONNREFUSED'))

        await expect(searchUsersAction({ accountId: '0900097' })).resolves.toEqual({
            ok: false,
            error: 'connect ECONNREFUSED'
        })
    })

    it('handles a non-Error rejection', async () => {
        mockFindUsers.mockRejectedValue('boom')

        await expect(searchUsersAction({})).resolves.toEqual({ ok: false, error: 'Unknown error' })
    })
})
