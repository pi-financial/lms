'use client'

import { useRouter } from 'next/navigation'
import { useTransition, type FormEvent } from 'react'
import { ContentNamespace } from '@libs/directus/definitions'

/**
 * Picks the namespaces by rewriting the query string; the Server Component re-reads Directus and
 * streams new HTML. Same pattern as the users filter — no fetching here.
 *
 * Language is not part of this form: the nav switcher owns it, and two controls for one value is
 * how you get a switcher that appears to do nothing.
 */
export function ContentParamsForm({ namespaces }: { namespaces: ContentNamespace[] }) {
    const router = useRouter()
    const [isPending, startTransition] = useTransition()

    function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault()

        const form = new FormData(event.currentTarget)
        const params = new URLSearchParams({ namespaces: form.getAll('namespaces').join(',') })

        startTransition(() => router.push(`/directus?${params.toString()}`))
    }

    const entries = Object.entries(ContentNamespace).filter(([, value]) => typeof value === 'number') as [
        string,
        ContentNamespace
    ][]

    return (
        <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-6 rounded border border-grey-200 p-4">
            <fieldset className="flex flex-col gap-1">
                <legend className="text-label-s-medium text-grey-700">Namespaces</legend>
                <div className="flex gap-4 pt-1">
                    {entries.map(([name, id]) => (
                        <label key={id} className="flex items-center gap-2 text-body-m">
                            <input
                                type="checkbox"
                                name="namespaces"
                                value={id}
                                defaultChecked={namespaces.includes(id)}
                            />
                            {name}
                        </label>
                    ))}
                </div>
            </fieldset>

            <button
                type="submit"
                disabled={isPending}
                className="rounded bg-pi-mint-500 px-4 py-2 text-body-m text-white hover:bg-pi-mint-600 disabled:opacity-50"
            >
                {isPending ? 'Loading…' : 'Load'}
            </button>
        </form>
    )
}
