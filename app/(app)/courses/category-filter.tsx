import Link from 'next/link'
import { CATEGORIES, type Category } from '@libs/api/definitions'
import { cn } from '@libs/ui/cn'

/**
 * The category axis of the course list.
 *
 * Chips rather than a `<select>`: there are five, they are what the page is organised by, and a
 * count beside each answers "is there anything in there" before it is opened.
 *
 * Links, not buttons with an `onClick` — so this stays a Server Component, each filter is a real
 * URL a learner can send to a colleague, and the back button walks the filters. The page re-renders
 * on the server with the new `searchParams`; there is no client-side list to keep in sync.
 */
export function CategoryFilter({
    counts,
    active,
    hrefFor
}: {
    counts: Record<Category | 'all', number>
    active: Category | 'all'
    hrefFor: (category: Category | 'all') => string
}) {
    const options: (Category | 'all')[] = ['all', ...CATEGORIES]

    return (
        <div className="mb-4 flex flex-wrap gap-2">
            {options.map(option => {
                const selected = option === active
                const count = counts[option] ?? 0

                return (
                    <Link
                        key={option}
                        href={hrefFor(option)}
                        // `aria-current`, not `aria-pressed`: these are links to filtered views of
                        // the page, and "true" on a link means this is the one being shown.
                        aria-current={selected ? 'page' : undefined}
                        className={cn(
                            'inline-flex items-center gap-2 rounded-full border-[1.5px] px-3.5 py-1.5 text-label-m-regular transition-colors',
                            selected
                                ? 'border-earned bg-earned-soft font-medium text-earned-ink'
                                : 'border-line bg-panel text-ink-2 hover:border-ink-3'
                        )}
                    >
                        {option === 'all' ? 'ทั้งหมด' : option}
                        <b
                            className={cn(
                                'font-rubik tnum text-label-s-medium',
                                selected ? 'opacity-85' : 'opacity-65'
                            )}
                        >
                            {count}
                        </b>
                    </Link>
                )
            })}
        </div>
    )
}
