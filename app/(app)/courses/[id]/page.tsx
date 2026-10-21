import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, Eye, Lock } from 'lucide-react'
import { auth } from '@libs/auth/config'
import { isEditor } from '@libs/auth/claims'
import { flatEpisodes, isUnlocked, type Attachment, type Episode } from '@libs/api/definitions'
import { getCourse } from '@libs/api/lms-srv'
import { Chip } from '@components/ui/chip'
import { FixtureNotice } from '@components/fixture-notice'
import { MediaGlyph } from '@components/ui/media-icon'
import { SetTrail } from '../../../trail'
import { EpisodePane } from './episode-pane'
import { EpisodeRail } from './episode-rail'

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const course = await getCourse(id)
    return { title: course?.title ?? 'ไม่พบคอร์ส' }
}

/**
 * The course screen: the outline on the left, the episode on the right.
 *
 * Which episode is open lives in the query string rather than in component state, so the page is a
 * Server Component, a link to a specific episode survives being pasted into a chat, and the back
 * button walks the episodes. With no `?ep=`, it opens the first one a learner can actually reach —
 * which is where "continue" should land, not at the top of a course they are halfway through.
 *
 * The rail comes first in the source: on a narrow screen a learner gets the course map before the
 * player, which is the order they need when deciding where they are.
 */
export default async function CoursePage({
    params,
    searchParams
}: {
    params: Promise<{ id: string }>
    searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
    const [{ id }, query, session] = await Promise.all([params, searchParams, auth()])
    const course = await getCourse(id)
    if (!course) notFound()

    // An editor is reviewing the course, not taking it: someone checking that EP 4 renders cannot
    // be made to sit through EP 1–3. The bypass only opens what is reachable — nothing about a
    // learner's record changes, and this account's own progress is unaffected.
    const bypass = isEditor(session?.roles)
    const episodes = flatEpisodes(course.sections)
    const current = resolveEpisode(episodes, query.ep, bypass)

    return (
        <>
            {/* Puts the course title in the top bar, which otherwise names only the section. */}
            <SetTrail title={course.title} />

            <FixtureNotice />

            {/* Named for where it goes, not for the page it lands on: "คอร์สทั้งหมด" is also the
                nav tab's label, so as a back link it read as this page's own heading. */}
            <Link
                href="/courses"
                className="inline-flex items-center gap-1.5 text-label-s-regular text-ink-3 hover:text-ink-2"
            >
                <ArrowLeft className="size-3" />
                กลับไปรายการคอร์ส
            </Link>

            <div className="mt-3 mb-5 flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
                <div className="min-w-60 flex-1">
                    <h1 className="text-h2 font-medium text-ink">{current?.title ?? course.title}</h1>

                    {/*
                     * Course, category and version as one quiet line rather than a tag, a second
                     * tag and a paragraph.
                     *
                     * All three answer the same question — which course this episode belongs to —
                     * and giving each its own shape made the eye stop three times to read one fact.
                     * The separators carry the structure instead, and the whole line recedes behind
                     * the heading, which is what someone actually arrived to read.
                     *
                     * The publication date is dropped here; it is on the course card, where a
                     * learner is choosing between versions rather than watching one.
                     */}
                    <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-label-m-regular text-ink-3">
                        <span className="text-ink-2">{course.title}</span>
                        <span aria-hidden>·</span>
                        <span>{course.category}</span>
                        <span aria-hidden>·</span>
                        <span className="font-rubik tnum">{course.version}</span>
                    </p>
                </div>

                {/* The one thing here that is a state rather than a label, so it keeps its chip. */}
                {bypass ? (
                    <Chip tone="neutral">
                        <Eye className="size-2.5" />
                        Editor — เปิดได้ทุกตอน
                    </Chip>
                ) : (
                    <Chip tone="warn">
                        <Lock className="size-2.5" />
                        ห้ามข้าม · ต้องดูอย่างน้อย {course.watchPercent}%
                    </Chip>
                )}
            </div>

            {course.sections.length === 0 ? (
                <OutlineMissing courseTitle={course.title} />
            ) : (
                // The pane is capped where the rail is not: a 16:9 video stretched across 1300px is
                // taller than the viewport, so the player would scroll its own controls off screen.
                <div className="grid items-start gap-4 lg:grid-cols-[17rem_minmax(0,64rem)]">
                    <EpisodeRail
                        sections={course.sections}
                        courseId={course.id}
                        currentId={current?.id ?? ''}
                        watchPercent={course.watchPercent}
                        bypass={bypass}
                    />

                    <div className="flex min-w-0 flex-col gap-4">
                        {current ? (
                            <EpisodePane episode={current} watchPercent={course.watchPercent} bypass={bypass} />
                        ) : null}
                        {course.attachments.length > 0 ? <Attachments files={course.attachments} /> : null}
                    </div>
                </div>
            )}
        </>
    )
}

/**
 * The episode to show.
 *
 * A `?ep=` naming a locked episode is refused rather than honoured — the rail will not link to one,
 * so a request for it was typed or shared, and serving it would make the lock a presentational
 * detail. Falling back to the furthest reachable episode is what makes a bare `/courses/aml-2026`
 * behave like "continue".
 */
function resolveEpisode(episodes: Episode[], raw: string | string[] | undefined, bypass: boolean): Episode | undefined {
    const wanted = Array.isArray(raw) ? raw[0] : raw
    const index = episodes.findIndex(episode => episode.id === wanted)
    if (index >= 0 && isUnlocked(episodes, index, bypass)) return episodes[index]

    const firstUnfinished = episodes.findIndex((episode, i) => !episode.done && isUnlocked(episodes, i, bypass))
    return episodes[firstUnfinished >= 0 ? firstUnfinished : 0]
}

/**
 * Reference material, listed below the episode.
 *
 * Never gated and never counted as progress: these are documents to look things up in, and a
 * learner who wants the AML handbook on their phone during a client call should not have to finish
 * a video first.
 *
 * TODO(lms-srv): the download link needs a short-lived presigned URL per file. Until then the rows
 * list what exists without offering a link that would 404.
 */
function Attachments({ files }: { files: Attachment[] }) {
    return (
        <div className="rounded-xl border border-line bg-panel p-5 shadow-(--shadow-panel)">
            <div className="mb-3 flex items-baseline gap-3">
                <h2 className="text-sub-hl font-medium text-ink">เอกสารแนบ</h2>
                <span className="text-label-s-regular text-ink-3">{files.length} ไฟล์</span>
            </div>

            <ul className="flex flex-col gap-2">
                {files.map(file => (
                    <li
                        key={file.id}
                        className="flex items-center gap-3 rounded-lg border border-line bg-surface px-3 py-2.5"
                    >
                        <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-panel-2 text-ink-2">
                            <MediaGlyph name={file.icon} size="md" />
                        </span>
                        <span className="min-w-0 flex-1">
                            <span className="block text-label-m-regular text-ink">{file.name}</span>
                            <span className="block text-label-xs-regular text-ink-3">{file.meta}</span>
                        </span>
                    </li>
                ))}
            </ul>

            <p className="mt-3 text-label-s-regular text-ink-3">
                ดาวน์โหลดได้ตลอดเวลา ไม่ต้องรอดูวิดีโอจบ — ไฟล์เป็นเอกสารอ้างอิง ไม่นับเป็นความคืบหน้า
                <br />
                ปุ่มดาวน์โหลดยังไม่มี — รอ <code className="font-rubik">lms-srv</code> ออก presigned URL ให้แต่ละไฟล์
            </p>
        </div>
    )
}

/** Most courses have no outline authored yet; this says so rather than rendering an empty rail. */
function OutlineMissing({ courseTitle }: { courseTitle: string }) {
    return (
        <div className="rounded-xl border border-line bg-panel p-5 shadow-(--shadow-panel)">
            <h2 className="text-sub-hl font-medium text-ink">ยังไม่มีเนื้อหาในคอร์สนี้</h2>
            <p className="mt-1 text-body-s text-ink-3">
                ตอนและไฟล์ของ “{courseTitle}” ยังไม่ได้ทำเป็นข้อมูลตัวอย่าง — ดูตัวอย่างหน้าเรียนเต็มรูปแบบได้ที่{' '}
                <Link href="/courses/aml-2026" className="text-earned-ink underline underline-offset-2">
                    การป้องกันการฟอกเงิน (AML) 2026
                </Link>
            </p>
            <ul className="mt-4 flex list-disc flex-col gap-2 pl-5 text-body-s text-ink-2">
                <li>
                    <code className="font-rubik">GET /api/v1/courses/{'{id}'}</code> — คอร์สพร้อมหมวด ตอน และไฟล์แนบ
                </li>
                <li>ตอนมี 3 แบบ: วิดีโอ (วัดจากเวลาที่ดู) สไลด์ (วัดจากหน้าที่เปิด) และแบบทดสอบ (วัดจากคะแนน)</li>
                <li>ตอนถัดไปเปิดเมื่อตอนก่อนหน้าจบ — server เป็นคนตัดสิน ไม่ใช่หน้าเว็บ</li>
            </ul>
        </div>
    )
}
