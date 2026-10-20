'use client'

import { useRouter } from 'next/navigation'
import { useTransition, type FormEvent } from 'react'
import type { FeatureAttributes } from '@libs/growthbook/server'
import { ATTRIBUTE_KEYS } from './attributes'

/**
 * Changes the targeting attributes by rewriting the query string, exactly like the users filter:
 * the Server Component re-evaluates and streams new HTML. No flag evaluation happens here.
 */
export function AttributesForm({ values }: { values: FeatureAttributes }) {
    const router = useRouter()
    const [isPending, startTransition] = useTransition()

    function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault()

        const form = new FormData(event.currentTarget)
        const params = new URLSearchParams()
        for (const [key, value] of form.entries()) {
            const trimmed = String(value).trim()
            if (trimmed) params.set(key, trimmed)
        }

        startTransition(() => router.push(`/growthbook?${params.toString()}`))
    }

    return (
        <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-4 rounded border border-grey-200 p-4">
            {ATTRIBUTE_KEYS.map(key => (
                <label key={key} className="flex flex-col gap-1">
                    <span className="text-label-s-medium text-grey-700">{key}</span>
                    <input
                        name={key}
                        defaultValue={String(values[key] ?? '')}
                        className="w-40 rounded border border-grey-300 px-3 py-2 text-body-m focus:border-pi-mint-500 focus:outline-none"
                    />
                </label>
            ))}

            <button
                type="submit"
                disabled={isPending}
                className="rounded bg-pi-mint-500 px-4 py-2 text-body-m text-white hover:bg-pi-mint-600 disabled:opacity-50"
            >
                {isPending ? 'Evaluating…' : 'Evaluate'}
            </button>
        </form>
    )
}
