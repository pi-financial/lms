import type { PiUser } from '@libs/user/definitions'
import { searchUsersAction } from './action'
import { parseFilters } from './filters'
import { UsersFilter } from './users-filter'

/**
 * Demo page: reads filters from the URL, calls user-srv-v2 on the server, renders a table.
 *
 * Everything except the filter form runs on the server. The generated client-lib, the internal
 * service host and the response DTOs never reach the browser — open devtools and there is no XHR
 * for the data, just HTML.
 *
 * Data access goes through `./action` rather than `@libs/user/service` directly, so the page and
 * any future client-triggered refresh share one entry point with one error contract.
 */
export const dynamic = 'force-dynamic'

export default async function UsersPage({
    searchParams
}: {
    searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
    const raw = await searchParams
    const filters = parseFilters(raw)
    // Rendered inline rather than thrown to an error boundary, so the filter form stays usable —
    // and so a developer off the VPN gets told why the page is empty.
    const result = await searchUsersAction(raw)

    return (
        <main className="mx-auto max-w-6xl px-6 py-10">
            <h1 className="text-h1 font-semibold">Users</h1>
            <p className="mt-1 text-body-s text-grey-600">
                Server Component → <code>@pi-financial/user-srv-v2-client-axios</code> →{' '}
                <code>GET /internal/v1/users</code>
            </p>

            <div className="mt-6">
                <UsersFilter values={filters} />
            </div>

            {!result.ok ? (
                <div className="mt-6 rounded border border-red-300 bg-red-50 p-4 text-body-m text-red-700">
                    <p className="font-medium">Could not reach user-srv-v2.</p>
                    <p className="mt-1 text-body-s">{result.error}</p>
                    <p className="mt-2 text-body-s">
                        <code>USER_V2_HOST</code> resolves only inside the Pi network — connect to the VPN or point it
                        at a mock.
                    </p>
                </div>
            ) : (
                <UsersTable users={result.users} />
            )}
        </main>
    )
}

function UsersTable({ users }: { users: PiUser[] }) {
    if (users.length === 0) {
        return <p className="mt-6 text-body-m text-grey-600">No users matched these filters.</p>
    }

    return (
        <>
            <p className="mt-6 text-body-s text-grey-600">{`${users.length} result(s)`}</p>

            <table className="mt-2 w-full border-collapse text-body-s">
                <thead>
                    <tr className="border-b border-grey-300 text-left text-label-s-medium text-grey-700">
                        <th className="py-2 pr-4">Name (TH)</th>
                        <th className="py-2 pr-4">Name (EN)</th>
                        <th className="py-2 pr-4">Email</th>
                        <th className="py-2 pr-4">Phone</th>
                        <th className="py-2 pr-4">Accounts</th>
                        <th className="py-2 pr-4">Wealth</th>
                        <th className="py-2 pr-4">Risk</th>
                        <th className="py-2">Devices</th>
                    </tr>
                </thead>
                <tbody>
                    {users.map(user => (
                        <tr key={user.id} className="border-b border-grey-100">
                            <td className="py-2 pr-4">{user.nameTh || '—'}</td>
                            <td className="py-2 pr-4">{user.nameEn || '—'}</td>
                            <td className="py-2 pr-4">{user.email || '—'}</td>
                            <td className="py-2 pr-4">{user.phoneNumber || '—'}</td>
                            <td className="py-2 pr-4">{user.custCodes.join(', ') || '—'}</td>
                            <td className="py-2 pr-4">{user.wealthType || '—'}</td>
                            <td className="py-2 pr-4">{user.riskLevel || '—'}</td>
                            <td className="py-2">{user.deviceCount}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </>
    )
}
