'use client'

import { useState, useTransition } from 'react'
import { revalidateContentAction } from './action'

/**
 * The one Client Component in this route: a button that calls the Server Action.
 *
 * It calls an action rather than an API route because this is a mutation of server state (the cache
 * tag), not a read. No `router.refresh()` is needed — `updateTag` inside a Server Action re-renders
 * the current route with the fresh content as part of the same response.
 */
export function RevalidateButton() {
    const [isPending, startTransition] = useTransition()
    const [error, setError] = useState<string | null>(null)

    function handleClick() {
        startTransition(async () => {
            const result = await revalidateContentAction()
            setError(result.ok ? null : result.error)
        })
    }

    return (
        <div className="flex items-center gap-3">
            <button
                type="button"
                onClick={handleClick}
                disabled={isPending}
                className="rounded bg-pi-mint-500 px-4 py-2 text-body-m text-white hover:bg-pi-mint-600 disabled:opacity-50"
            >
                {isPending ? 'Revalidating…' : 'Revalidate cache tag'}
            </button>
            {error ? <span className="text-body-s text-red-700">{error}</span> : null}
        </div>
    )
}
