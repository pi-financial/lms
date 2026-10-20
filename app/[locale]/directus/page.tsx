import { DIRECTUS_CACHE_TAG, type ContentRow } from '@libs/directus/content'
import { DEFAULT_LOCALE, isLocale } from '@libs/preferences/definitions'
import { getContentAction } from './action'
import { parseNamespaces } from './params'
import { ContentParamsForm } from './params-form'
import { RevalidateButton } from './revalidate-button'

/**
 * Demo page: reads the shared `web_contents` collection in a Server Component and shows both the
 * translation query and the caching contract.
 *
 * `DIRECTUS_TOKEN` never leaves the server — the SDK client is `server-only`, content is fetched
 * here and handed down as rendered HTML.
 */
export const dynamic = 'force-dynamic'

export default async function DirectusPage({
    params,
    searchParams
}: {
    params: Promise<{ locale: string }>
    searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
    const [{ locale: rawLocale }, raw] = await Promise.all([params, searchParams])
    const locale = isLocale(rawLocale) ? rawLocale : DEFAULT_LOCALE
    const namespaces = parseNamespaces(raw)
    // The language comes from the URL, so `/th/directus` and `/en/directus` are genuinely different
    // documents — shareable, cacheable and crawlable, which a cookie-based locale is not.
    const { items, degraded } = await getContentAction(locale, raw)

    return (
        <main className="mx-auto max-w-4xl px-6 py-10">
            <h1 className="text-h1 font-semibold">Directus</h1>
            <p className="mt-1 text-body-s text-grey-600">
                Server Component → <code>@directus/sdk</code> → <code>web_contents</code>, deep-filtered to{' '}
                <strong>{locale}</strong> (from the URL), cached for 1h under the tag <code>{DIRECTUS_CACHE_TAG}</code>
            </p>

            <div className="mt-6 space-y-4">
                <ContentParamsForm namespaces={namespaces} />
                <RevalidateButton />
            </div>

            {degraded ? (
                <div className="mt-6 rounded border border-orange-300 bg-orange-50 p-4 text-body-m text-orange-800">
                    <p className="font-medium">Directus is unreachable — showing an empty list.</p>
                    <p className="mt-1 text-body-s">
                        The page still renders: a CMS outage degrades content, it does not take the route down. Set{' '}
                        <code>DIRECTUS_HOST</code> and <code>DIRECTUS_TOKEN</code> in <code>.env.local</code> to see
                        real data.
                    </p>
                </div>
            ) : (
                <ContentTable items={items} />
            )}
        </main>
    )
}

function ContentTable({ items }: { items: ContentRow[] }) {
    if (items.length === 0) {
        return <p className="mt-6 text-body-m text-grey-600">No content rows in these namespaces.</p>
    }

    return (
        <>
            <p className="mt-6 text-body-s text-grey-600">{`${items.length} row(s)`}</p>

            <table className="mt-2 w-full border-collapse text-body-s">
                <thead>
                    <tr className="border-b border-grey-300 text-left text-label-s-medium text-grey-700">
                        <th className="w-24 py-2 pr-4">ID</th>
                        <th className="w-32 py-2 pr-4">Namespace</th>
                        <th className="py-2">Value</th>
                    </tr>
                </thead>
                <tbody>
                    {items.map(item => (
                        <tr key={item.id} className="border-b border-grey-100 align-top">
                            <td className="py-2 pr-4">{item.id}</td>
                            <td className="py-2 pr-4">{item.namespace}</td>
                            {/* A row with no translation in this language renders blank, not "undefined". */}
                            <td className="py-2">{item.translations[0]?.value ?? '—'}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </>
    )
}
