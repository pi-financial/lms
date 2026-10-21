import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@libs/ui/cn'

/**
 * A short status word beside the thing it describes.
 *
 * Three tones, and the distinction is what the reader should do about it: `neutral` is a fact,
 * `ok` is finished, `warn` is outstanding. Colour is never the only carrier — every call site
 * passes words — so the three remain distinguishable to a reader who cannot separate them.
 */
const chipVariants = cva(
    // `gap-1` rather than the 1.5 an emoji needed: a lucide glyph fills its box edge to edge, where
    // an emoji carried its own padding, so the same gap now reads as a space between two things.
    'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-label-xs-regular whitespace-nowrap',
    {
        variants: {
            tone: {
                neutral: 'border border-line bg-panel text-ink-2',
                ok: 'bg-earned-soft font-medium text-earned-ink',
                warn: 'bg-locked-soft font-medium text-locked'
            }
        },
        defaultVariants: { tone: 'neutral' }
    }
)

export function Chip({
    className,
    tone,
    ...props
}: React.HTMLAttributes<HTMLSpanElement> & VariantProps<typeof chipVariants>) {
    return <span className={cn(chipVariants({ tone, className }))} {...props} />
}

/**
 * The course's product category — a property of the course itself, not of this learner's standing
 * in it, which is why it reads quieter than a status chip and squarer than one.
 */
export function CategoryTag({ className, ...props }: React.HTMLAttributes<HTMLSpanElement>) {
    return (
        <span
            className={cn(
                'inline-flex rounded bg-earned-soft px-2 py-0.5 text-label-xs-medium whitespace-nowrap text-earned-ink',
                className
            )}
            {...props}
        />
    )
}

/**
 * The content version, and when it was published.
 *
 * What tells a learner whether the course they finished last year is the same one published now,
 * so it travels with the category everywhere the category appears.
 */
export function VersionTag({ className, ...props }: React.HTMLAttributes<HTMLSpanElement>) {
    return (
        <span
            className={cn('font-rubik tnum text-label-xs-regular whitespace-nowrap text-ink-3', className)}
            {...props}
        />
    )
}
