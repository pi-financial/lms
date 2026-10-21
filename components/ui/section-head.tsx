import { cn } from '@libs/ui/cn'

/**
 * A heading with the count of what is under it.
 *
 * The count is part of the heading rather than a line below it because it answers the question the
 * heading raises — "เรียนจบแล้ว" invites "กี่คอร์ส" — and a reader scanning headings should not
 * have to read the grid to find out.
 */
export function SectionHead({
    title,
    count,
    className,
    children
}: {
    title: string
    count?: string
    className?: string
    children?: React.ReactNode
}) {
    return (
        <div className={cn('mb-3.5 flex items-baseline gap-3', className)}>
            <h2 className="text-h3 font-medium text-ink">{title}</h2>
            {count ? <span className="text-label-s-regular text-ink-3">{count}</span> : null}
            {children ? <div className="ml-auto">{children}</div> : null}
        </div>
    )
}

/** The title and standfirst every screen opens with. */
export function PageHead({ title, summary }: { title: string; summary?: string }) {
    return (
        <div className="mb-6">
            <h1 className="text-h1 font-medium text-ink">{title}</h1>
            {summary ? <p className="mt-1 text-body-m text-ink-2">{summary}</p> : null}
        </div>
    )
}

/**
 * One figure and what it counts.
 *
 * `tone` colours only the number, and only where the number carries a judgement — a count of
 * failures is not the same fact as a count of passes. A plain total stays in body ink.
 */
export function StatTile({
    value,
    label,
    tone = 'plain'
}: {
    value: string
    label: string
    tone?: 'plain' | 'earned' | 'locked'
}) {
    const toneClass = {
        plain: 'text-ink',
        earned: 'text-earned',
        locked: 'text-locked'
    }[tone]

    return (
        <div className="rounded-xl border border-line bg-panel p-4 shadow-(--shadow-panel)">
            <div className={cn('font-rubik tnum text-display2', toneClass)}>{value}</div>
            <div className="mt-0.5 text-label-s-regular text-ink-3">{label}</div>
        </div>
    )
}
