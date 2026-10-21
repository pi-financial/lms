import Link from 'next/link'
import { Check, Lock } from 'lucide-react'
import { formatDuration, isUnlocked, type Episode, type Section } from '@libs/api/definitions'
import { EpisodeGlyph } from '@components/ui/media-icon'
import { ProgressBar } from '@components/ui/progress-bar'
import { cn } from '@libs/ui/cn'

/**
 * The course's shape, and the lock rule made visible.
 *
 * Every episode is listed including the ones a learner cannot open yet — a rail that showed only
 * what is reachable would hide how much is left, which is the main thing someone deciding whether
 * to start wants to know.
 *
 * A locked row is a `<span>`, not a disabled link: a disabled link is still in the tab order in
 * some browsers and still reads as "link" to a screen reader, promising a destination that is not
 * there.
 */
export function EpisodeRail({
    sections,
    courseId,
    currentId,
    watchPercent,
    bypass
}: {
    sections: Section[]
    courseId: string
    currentId: string
    watchPercent: number
    bypass: boolean
}) {
    const episodes = sections.flatMap(section => section.episodes)
    const doneCount = episodes.filter(episode => episode.done).length

    // The flat position of each episode, which is what the lock rule is expressed in — a section is
    // a grouping and owns no gate of its own. Resolved up front rather than counted while
    // rendering: a counter mutated inside JSX is read in whatever order React chooses to evaluate
    // the tree, and the numbers drift the first time that is not top to bottom.
    const flatIndexOf = new Map(episodes.map((episode, index) => [episode.id, index]))

    return (
        <aside className="overflow-hidden rounded-xl border border-line bg-panel shadow-(--shadow-panel) lg:sticky lg:top-19">
            <div className="flex items-baseline justify-between gap-3 px-3.5 pt-3.5 pb-2">
                <h2 className="text-label-m-medium text-ink">เนื้อหาคอร์ส</h2>
                <span className="font-rubik tnum text-label-s-regular text-ink-3">
                    {doneCount} / {episodes.length}
                </span>
            </div>
            <ProgressBar
                className="mx-3.5 mb-3 w-auto"
                value={episodes.length > 0 ? (doneCount / episodes.length) * 100 : 0}
                label="ความคืบหน้าของคอร์ส"
            />

            {sections.map(section => {
                const sectionDone = section.episodes.filter(episode => episode.done).length

                return (
                    <div key={section.title}>
                        <div className="flex items-baseline gap-2 border-t border-line bg-panel-2 px-3.5 py-2.5">
                            <h3 className="min-w-0 flex-1 text-label-s-medium text-ink">{section.title}</h3>
                            <span className="font-rubik tnum shrink-0 text-label-xs-regular text-ink-3">
                                {sectionDone} / {section.episodes.length}
                            </span>
                        </div>

                        {section.episodes.map(episode => {
                            const index = flatIndexOf.get(episode.id) ?? 0
                            return (
                                <EpisodeRow
                                    key={episode.id}
                                    episode={episode}
                                    courseId={courseId}
                                    number={index + 1}
                                    unlocked={isUnlocked(episodes, index, bypass)}
                                    // Reachable only because an editor is looking. Marked, so a
                                    // preview never reads as "a learner would see this open too".
                                    peek={bypass && !episode.done && !isUnlocked(episodes, index)}
                                    current={episode.id === currentId}
                                    watchPercent={watchPercent}
                                />
                            )
                        })}
                    </div>
                )
            })}
        </aside>
    )
}

function EpisodeRow({
    episode,
    courseId,
    number,
    unlocked,
    peek,
    current,
    watchPercent
}: {
    episode: Episode
    courseId: string
    number: number
    unlocked: boolean
    peek: boolean
    current: boolean
    watchPercent: number
}) {
    const className = cn(
        'flex w-full gap-2.5 border-t border-line-soft px-3.5 py-2.5 pl-5 text-left transition-colors',
        current && 'bg-earned-soft',
        unlocked ? 'hover:bg-panel-2' : 'opacity-45'
    )

    const body = (
        <>
            <span
                aria-hidden
                className={cn(
                    // `font-rubik` and `leading-none`: the number is set in the Latin face and with
                    // the line box collapsed to the glyph. Inherited, the marker takes Graphik TH,
                    // whose ascent leaves room for Thai vowel marks above the digit — and a 12px
                    // line-height token inside a 22px circle then sits the digit visibly high.
                    'font-rubik tnum mt-0.5 grid size-5.5 shrink-0 place-items-center rounded-full border-[1.5px] text-[0.65rem] leading-none',
                    episode.done
                        ? 'border-earned bg-earned text-white'
                        : current
                          ? 'border-2 border-earned text-earned-ink'
                          : // An episode open only because an editor is looking keeps its number and
                            // takes the warning colour. The eye glyph that used to sit here read as a
                            // control to press, and broke the column of numbers the rail is scanned by.
                            peek
                            ? 'border-locked text-locked'
                            : 'border-line text-ink-3'
                )}
            >
                {episode.done ? <Check className="size-2.5" /> : unlocked ? number : <Lock className="size-2.5" />}
            </span>

            <span className="min-w-0 flex-1">
                <span
                    className={cn('block text-label-m-regular', current ? 'font-medium text-earned-ink' : 'text-ink')}
                >
                    {episode.title}
                </span>
                <span className="mt-0.5 flex items-center gap-1.5 text-label-xs-regular text-ink-3">
                    <EpisodeGlyph kind={episode.kind} size="xs" />
                    <span className="min-w-0">
                        {episodeSubtitle(episode, watchPercent)}
                        {peek ? <span className="text-locked"> · ผู้เรียนยังเข้าไม่ได้</span> : null}
                    </span>
                </span>
            </span>
        </>
    )

    if (!unlocked) {
        return (
            <span className={className} aria-disabled="true">
                {body}
                <span className="sr-only">ล็อกอยู่ — ต้องเรียนตอนก่อนหน้าให้จบก่อน</span>
            </span>
        )
    }

    return (
        <Link
            href={`/courses/${courseId}?ep=${encodeURIComponent(episode.id)}`}
            aria-current={current ? 'true' : undefined}
            className={className}
        >
            {body}
        </Link>
    )
}

/**
 * The line under an episode's title: where this learner stands in it.
 *
 * Each kind phrases its own progress, because the three are not the same measurement — "4:18 /
 * 12:40" and "ผ่านที่ 70%" answer different questions, and a shared percentage would answer
 * neither well.
 */
function episodeSubtitle(episode: Episode, watchPercent: number): string {
    if (episode.kind === 'quiz') {
        if (episode.bestScore == null) return `${episode.questions ?? 0} ข้อ · ผ่านที่ ${episode.passMark ?? 0}%`
        return `${episode.done ? 'ผ่านแล้ว' : 'ยังไม่ผ่าน'} · ${episode.bestScore}%`
    }

    if (episode.kind === 'deck') {
        const pages = episode.pages ?? 0
        if (episode.done) return `อ่านครบแล้ว · ${pages} หน้า`
        return `${episode.pagesSeen ?? 0} / ${pages} หน้า`
    }

    const duration = episode.duration ?? 0
    if (episode.done) return `ดูครบแล้ว · ${formatDuration(duration)}`
    const watched = episode.watched ?? 0
    if (watched > 0) return `${formatDuration(watched)} / ${formatDuration(duration)} · ต้องดู ${watchPercent}%`
    return `ยังไม่เริ่ม · ${formatDuration(duration)}`
}
