import { render, screen } from '@testing-library/react'

// Jest hoists jest.mock() above the imports, so a factory may only close over variables whose names
// start with `mock`; and it runs while `@app/(app)/users/page` is being imported — before this module's
// own `const` has initialised — so it hands back a wrapper that reads the mock at call time.
const mockSearchUsersAction = jest.fn()
jest.mock('@app/(app)/users/action', () => ({
    searchUsersAction: (...args: unknown[]) => mockSearchUsersAction(...args)
}))

// UsersFilter is rendered as part of the page and calls useRouter, which needs an App Router
// context that only exists in a real Next runtime.
const mockPush = jest.fn()
jest.mock('next/navigation', () => ({ useRouter: () => ({ push: mockPush }) }))

import UsersPage from '@app/(app)/users/page'

const somchai = {
    id: 'u1',
    nameTh: 'สมชาย ใจดี',
    nameEn: 'Somchai Jaidee',
    email: 'somchai@example.com',
    phoneNumber: '0812345678',
    custCodes: ['0900097'],
    tradingAccounts: [],
    wealthType: 'Wealth',
    riskLevel: '4',
    dateOfBirth: '1990-01-15',
    deviceCount: 2
}

const renderPage = async (searchParams: Record<string, string | string[] | undefined>) =>
    render(await UsersPage({ searchParams: Promise.resolve(searchParams) }))

describe('UsersPage', () => {
    it('passes the raw query string to the action and renders the results', async () => {
        mockSearchUsersAction.mockResolvedValue({ ok: true, users: [somchai] })

        await renderPage({ accountId: '0900097' })

        // The page forwards the URL as-is; sanitising it is the action's job, tested separately.
        expect(mockSearchUsersAction).toHaveBeenCalledWith({ accountId: '0900097' })
        expect(screen.getByText('Somchai Jaidee')).toBeInTheDocument()
        expect(screen.getByText('somchai@example.com')).toBeInTheDocument()
        expect(screen.getByText('1 result(s)')).toBeInTheDocument()
    })

    it('seeds the filter form with the demo account when the URL has no filters', async () => {
        mockSearchUsersAction.mockResolvedValue({ ok: true, users: [] })

        await renderPage({})

        expect(screen.getByLabelText('Account ID')).toHaveValue('0900097')
    })

    it('says so plainly when nothing matched', async () => {
        mockSearchUsersAction.mockResolvedValue({ ok: true, users: [] })

        await renderPage({ accountId: '0000000' })

        expect(screen.getByText('No users matched these filters.')).toBeInTheDocument()
    })

    it('keeps the filter form usable when the service is unreachable', async () => {
        mockSearchUsersAction.mockResolvedValue({ ok: false, error: 'connect ECONNREFUSED' })

        await renderPage({ accountId: '0900097' })

        expect(screen.getByText('Could not reach user-srv-v2.')).toBeInTheDocument()
        expect(screen.getByText('connect ECONNREFUSED')).toBeInTheDocument()
        expect(screen.getByRole('button', { name: 'Search' })).toBeInTheDocument()
    })
})
