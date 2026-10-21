import Link from 'next/link'
import type { Course, CourseStatus } from '@libs/api/definitions'
import { Award, Check } from 'lucide-react'
import { CategoryTag, Chip, VersionTag } from '@components/ui/chip'
import { MediaGlyph } from '@components/ui/media-icon'
import { ProgressBar } from '@components/ui/progress-bar'
import { cn } from '@libs/ui/cn'

/** What the status chip says, and how loudly. */
const STATUS: Record<CourseStatus, { label: string; tone: 'neutral' | 'ok' | 'warn' }> = {
    'not-started': { label: 'ยังไม่เริ่ม', tone: 'neutral' },
    'in-progress': { label: 'กำลังเรียน', tone: 'neutral' },
    // The one state where the chip is the call to action rather than a description.
    'quiz-left': { label: 'เหลือแบบทดสอบ', tone: 'warn' },
    done: { label: 'เรียนจบแล้ว', tone: 'ok' }
}

/**
 * One course in a grid.
 *
 * A link, not a button: these navigate, and a learner who middle-clicks one expects a new tab.
 *
 * The whole card is the target rather than the title alone — a card with a small hit area inside a
 * large hover highlight is a card people click on and nothing happens.
 */
export function CourseCard({ course, href }: { course: Course; href: string }) {
    const status = STATUS[course.status]

    return (
        <Link
            href={href}
            className={cn(
                'flex flex-col gap-3 rounded-xl border border-line bg-panel p-4 shadow-(--shadow-panel)',
                'transition-[border-color,transform] duration-150 hover:-translate-y-px hover:border-earned',
                'focus-visible:ring-2 focus-visible:ring-earned focus-visible:ring-offset-2 focus-visible:outline-none'
            )}
        >
            <CourseArt course={course} />

            <div>
                <h3 className="text-sub-hl font-medium text-ink">{course.title}</h3>
                <p className="mt-1 text-label-s-regular text-ink-3">{course.resume ?? course.outline}</p>
                <div className="mt-2 flex flex-wrap items-center gap-1.5">
                    <CategoryTag>{course.category}</CategoryTag>
                    <VersionTag>
                        {course.version}
                        {course.versionDate ? ` · ${course.versionDate}` : ''}
                    </VersionTag>
                </div>
            </div>

            {/* Pushed to the bottom so the bars line up across a row of cards whose titles wrap to
                different heights — the row is read across, not card by card. */}
            <div className="mt-auto flex flex-col gap-2">
                <ProgressBar value={course.progress} label={`ความคืบหน้า ${course.title}`} />
                <div className="flex items-center justify-between text-label-s-regular text-ink-3">
                    <Chip tone={status.tone}>{status.label}</Chip>
                    <span className="font-rubik tnum">{course.progress}%</span>
                </div>
            </div>
        </Link>
    )
}

/**
 * The card's thumbnail.
 *
 * A generated gradient and a glyph rather than an image: courses carry no artwork yet, and a grid
 * of identical grey rectangles is harder to scan than a grid of distinguishable ones. Inline
 * styles because the two colours are data — a Tailwind class cannot be built from a value that
 * arrives at runtime.
 */
function CourseArt({ course }: { course: Course }) {
    return (
        <div
            aria-hidden
            className="grid h-26 place-items-center overflow-hidden rounded-lg bg-panel-2"
            style={{
                background: `linear-gradient(120deg, ${course.art.from}, ${course.art.to})`,
                color: course.art.ink
            }}
        >
            <MediaGlyph name={course.art.icon} size="lg" />
        </div>
    )
}

/**
 * A finished course, in the dashboard's narrower grid.
 *
 * Not a `CourseCard` with a flag: what a learner wants from a finished course is its certificate,
 * and that is a different card — no progress bar to read, no thumbnail to recognise it by, and an
 * action where the status chip would be.
 */
export function CompletedCard({ course, certificateHref }: { course: Course; certificateHref?: string }) {
    return (
        <div className="flex flex-col gap-2.5 rounded-xl border border-line bg-panel p-3.5 shadow-(--shadow-panel)">
            <div className="flex items-start justify-between gap-2">
                <h3 className="text-label-m-medium text-ink">{course.title}</h3>
                <Chip tone="ok" aria-label="เรียนจบแล้ว">
                    <Check className="size-2.5" />
                </Chip>
            </div>

            <CategoryTag className="self-start">{course.category}</CategoryTag>

            <div className="flex items-center justify-between text-label-s-regular text-ink-3">
                <span>จบเมื่อ {course.completedOn}</span>
                <span className="font-rubik tnum">100%</span>
            </div>

            {/*
             * Three states, not two, and conflating them is how a learner ends up waiting for a
             * document that was never coming — or clicking a link that 404s.
             *
             * A course that issues none says so. A course that issues one the learner holds links
             * to it. A course that issues one they do not hold yet says it is being prepared,
             * because the only way to reach this card is to have finished the course.
             */}
            {!course.certificate ? (
                <span className="text-label-s-regular text-ink-3">คอร์สนี้ไม่ออกใบรับรอง</span>
            ) : certificateHref ? (
                <Link
                    href={certificateHref}
                    className="flex items-center gap-1.5 self-start rounded-lg border border-line px-2.5 py-1 text-label-s-regular text-ink-2 hover:bg-panel-2"
                >
                    <Award className="size-3" />
                    ดูใบรับรอง
                </Link>
            ) : (
                <span className="text-label-s-regular text-ink-3">กำลังออกใบรับรอง</span>
            )}
        </div>
    )
}
