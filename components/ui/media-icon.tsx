import { FileText, LayoutGrid, PencilLine, Play, Presentation, ShieldCheck, type LucideIcon } from 'lucide-react'
import type { EpisodeKind, MediaIcon } from '@libs/api/definitions'
import { cn } from '@libs/ui/cn'

/**
 * Icon names back to components.
 *
 * The name travels from the server as plain data and is resolved here, in the bundle that already
 * holds the components — React cannot serialise a function across that boundary.
 *
 * Why not emoji, which these replace: every platform draws its own. A 🔒 is flat grey on one
 * machine and glossy gold on another, ▦ falls back to a hollow box where no font covers it, and
 * 🏅 is a different medal on Windows, macOS and Android. The same screen then looks different for
 * every learner, and none of those drawings match the stroke weight of the rest of the interface.
 */
const ICONS: Record<MediaIcon, LucideIcon> = {
    video: Play,
    deck: Presentation,
    quiz: PencilLine,
    document: FileText,
    secure: ShieldCheck,
    overview: LayoutGrid
}

/**
 * Icon sizes, named for the text they sit beside rather than in pixels.
 *
 * An icon next to a label should read as part of that line, not as a second thing competing with
 * it — which in practice means a touch *smaller* than the type it accompanies, because a lucide
 * glyph fills its box where a letter leaves side bearings. Sized by eye against each text token
 * and kept here so the next one added is consistent rather than guessed at again.
 *
 * `shrink-0` on every one: an icon in a flex row with a long Thai title is the thing that gets
 * squashed first, and a squashed icon is noticeable in a way a wrapped word is not.
 */
const SIZES = {
    /** Beside `text-label-xs-regular` (10px) — the rail's subtitle, a chip. */
    xs: 'size-2.5',
    /** Beside `text-label-s-regular` / `text-body-s` (12px) — a metadata line. */
    sm: 'size-3',
    /** Beside `text-label-m-regular` / `text-body-m` (14px) — a nav tab, an attachment row. */
    md: 'size-3.5',
    /** Standalone, where the icon is the content: a card's artwork. */
    lg: 'size-6'
} as const

export type IconSize = keyof typeof SIZES

/** The icon for a piece of content, by name. Decorative — the text beside it carries the meaning. */
export function MediaGlyph({ name, size = 'md', className }: { name: MediaIcon; size?: IconSize; className?: string }) {
    const Icon = ICONS[name]
    return <Icon className={cn('shrink-0', SIZES[size], className)} aria-hidden />
}

/** An episode's kind maps onto the same set; named separately so a caller need not know it does. */
const EPISODE_ICONS: Record<EpisodeKind, MediaIcon> = { video: 'video', deck: 'deck', quiz: 'quiz' }

export function EpisodeGlyph({
    kind,
    size = 'md',
    className
}: {
    kind: EpisodeKind
    size?: IconSize
    className?: string
}) {
    return <MediaGlyph name={EPISODE_ICONS[kind]} size={size} className={className} />
}
