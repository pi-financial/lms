import Image from 'next/image'
import Link from 'next/link'
import { isLocale, withLocale, DEFAULT_LOCALE } from '@libs/preferences/definitions'
import { NAV_ITEMS } from '../nav-items'

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
    const { locale: raw } = await params
    const locale = isLocale(raw) ? raw : DEFAULT_LOCALE

    return (
        <main className="mx-auto max-w-3xl px-6 py-16">
            {/* Decorative: the heading beside it already names the product, so alt is empty. */}
            <Image src="/images/logo.svg" alt="" width={40} height={48} priority unoptimized />

            <h1 className="mt-4 text-h1 font-semibold text-pi-mint-700">Pi Next.js Boilerplate</h1>

            <p className="mt-4 text-body-m text-grey-700">
                Server Components by default, Pi design tokens as Tailwind utilities, and no UI framework — pick your
                own.
            </p>

            <ul className="mt-8 divide-y divide-grey-100 border-y border-grey-200">
                {NAV_ITEMS.map(item => (
                    <li key={item.href}>
                        <Link
                            href={item.external ? item.href : withLocale(locale, item.href)}
                            target={item.external ? '_blank' : undefined}
                            rel={item.external ? 'noreferrer' : undefined}
                            className="block py-4 hover:bg-grey-100"
                        >
                            <span className="text-subh-m text-pi-mint-700">
                                {item.label} {item.external ? '↗' : '→'}
                            </span>
                            <span className="mt-1 block text-body-s text-grey-600">{item.description}</span>
                        </Link>
                    </li>
                ))}
            </ul>
        </main>
    )
}
