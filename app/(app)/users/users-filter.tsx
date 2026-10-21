'use client'

import { useRouter } from 'next/navigation'
import { useTransition, type FormEvent } from 'react'
import type { UserFilters } from '@libs/user/definitions'

/**
 * The only Client Component on this page, and it does not fetch anything.
 *
 * That is the pattern worth copying: interactivity lives at the leaves, data lives on the server.
 * Submitting rewrites the query string; Next re-runs the Server Component with the new
 * `searchParams` and streams fresh HTML. No client-side data layer, no loading state to manage, no
 * chance of the browser and the server disagreeing about what the current filter is.
 *
 * `useTransition` gives the pending flag — the navigation is what's loading, not a fetch.
 *
 * Current values arrive as props rather than from `useSearchParams`, which would force this subtree
 * into a Suspense boundary for no benefit: the server already knows them.
 */
const FIELDS: { name: keyof UserFilters; label: string; placeholder?: string }[] = [
    { name: 'accountId', label: 'Account ID', placeholder: '0900097' },
    { name: 'firstName', label: 'First name' },
    { name: 'lastName', label: 'Last name' },
    { name: 'email', label: 'Email' },
    { name: 'phoneNumber', label: 'Phone number' }
]

export function UsersFilter({ values }: { values: UserFilters }) {
    const router = useRouter()
    const [isPending, startTransition] = useTransition()

    function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault()

        const form = new FormData(event.currentTarget)
        const params = new URLSearchParams()
        for (const [key, value] of form.entries()) {
            const trimmed = String(value).trim()
            // Empty inputs must not become `?email=` — the service treats a present-but-blank
            // filter as a real one and matches nothing.
            if (trimmed) params.set(key, trimmed)
        }

        startTransition(() => router.push(`/users?${params.toString()}`))
    }

    return (
        <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-4 rounded border border-grey-200 p-4">
            {FIELDS.map(field => (
                <label key={field.name} className="flex flex-col gap-1">
                    <span className="text-label-s-medium text-grey-700">{field.label}</span>
                    <input
                        name={field.name}
                        defaultValue={values[field.name] ?? ''}
                        placeholder={field.placeholder}
                        className="w-48 rounded border border-grey-300 px-3 py-2 text-body-m focus:border-pi-mint-500 focus:outline-none"
                    />
                </label>
            ))}

            <button
                type="submit"
                disabled={isPending}
                className="rounded bg-pi-mint-500 px-4 py-2 text-body-m text-white hover:bg-pi-mint-600 disabled:opacity-50"
            >
                {isPending ? 'Searching…' : 'Search'}
            </button>
        </form>
    )
}
