import { evaluateFeaturesAction } from './action'
import { parseAttributes } from './attributes'
import { AttributesForm } from './attributes-form'
import { ClientFlag } from './client-flag'

/**
 * Demo page: evaluates every registered flag on the server for the attributes in the URL.
 *
 * The GrowthBook client key and the raw payload — which contains the targeting rules — stay on the
 * server. Only the evaluated values reach the browser.
 */
export const dynamic = 'force-dynamic'

export default async function GrowthBookPage({
    searchParams
}: {
    searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
    const raw = await searchParams
    const attributes = parseAttributes(raw)
    const result = await evaluateFeaturesAction(raw)

    return (
        <main className="mx-auto max-w-4xl px-6 py-10">
            <h1 className="text-h1 font-semibold">GrowthBook</h1>
            <p className="mt-1 text-body-s text-grey-600">
                Server Component → <code>GrowthBookClient</code> → evaluated per request, only the results are sent to
                the browser
            </p>

            <div className="mt-6">
                <AttributesForm values={attributes} />
            </div>

            {!result.ok ? (
                <div className="mt-6 rounded border border-red-300 bg-red-50 p-4 text-body-m text-red-700">
                    <p className="font-medium">Could not evaluate features.</p>
                    <p className="mt-1 text-body-s">{result.error}</p>
                </div>
            ) : (
                <FeatureTable features={result.features} />
            )}

            <div className="mt-8 rounded border border-grey-200 p-4">
                <ClientFlag />
            </div>
        </main>
    )
}

function FeatureTable({ features }: { features: Record<string, { defaultValue: unknown }> }) {
    const entries = Object.entries(features)

    return (
        <table className="mt-6 w-full border-collapse text-body-s">
            <thead>
                <tr className="border-b border-grey-300 text-left text-label-s-medium text-grey-700">
                    <th className="py-2 pr-4">Flag</th>
                    <th className="py-2">Evaluated value</th>
                </tr>
            </thead>
            <tbody>
                {entries.map(([key, value]) => (
                    <tr key={key} className="border-b border-grey-100">
                        <td className="py-2 pr-4">
                            <code>{key}</code>
                        </td>
                        <td className="py-2">{JSON.stringify(value.defaultValue)}</td>
                    </tr>
                ))}
            </tbody>
        </table>
    )
}
