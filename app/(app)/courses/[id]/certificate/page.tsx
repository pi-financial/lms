import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Award, ArrowLeft, RotateCcw } from 'lucide-react'
import { flatEpisodes, type Episode } from '@libs/api/definitions'
import { getCertificate, getCourse } from '@libs/api/lms-srv'
import { CertificateFace } from '@components/certificate-face'
import { FixtureNotice } from '@components/fixture-notice'
import { Chip, CategoryTag, VersionTag } from '@components/ui/chip'
import { EpisodeGlyph } from '@components/ui/media-icon'
import { SectionHead } from '@components/ui/section-head'
import { SetTrail } from '../../../../trail'

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const certificate = await getCertificate(id)
    return { title: certificate ? `ใบรับรอง · ${certificate.courseTitle}` : 'ไม่พบใบรับรอง' }
}

/**
 * One learner's certificate for one course.
 *
 * **The access rule is the whole point of this route.** A certificate belongs to a person, so the
 * page is reachable only by the person who holds one: `getCertificate` resolves the holder from
 * the session — never from a parameter — and a learner who has not earned this one gets a 404.
 *
 * `notFound()` rather than a "you have not earned this yet" screen: the URL is guessable from any
 * course id, and a page that distinguished *not earned* from *no such course* would confirm which
 * courses a colleague had passed. The nav never links here unless the certificate exists; this is
 * what holds when someone types the URL anyway.
 *
 * TODO(lms-srv): the download is the artefact a learner actually wants. It needs the service to
 * render the PDF and hand back a short-lived signed URL — generating it in the browser would mean
 * the document could be assembled with any name in it.
 */
export default async function CertificatePage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const [certificate, course] = await Promise.all([getCertificate(id), getCourse(id)])

    // Either the course does not exist, or this learner holds no certificate for it. The two are
    // deliberately indistinguishable from outside.
    if (!certificate || !course) notFound()

    const episodes = flatEpisodes(course.sections)

    return (
        <>
            <SetTrail title={`ใบรับรอง · ${certificate.courseTitle}`} />
            <FixtureNotice />

            <Link
                href={`/courses/${id}`}
                className="inline-flex items-center gap-1.5 text-label-s-regular text-ink-3 hover:text-ink-2"
            >
                <ArrowLeft className="size-3" />
                กลับไปหน้าคอร์ส
            </Link>

            <div className="mt-3 grid gap-5 rounded-xl border border-line bg-panel p-5 shadow-(--shadow-panel) lg:grid-cols-[minmax(0,1fr)_22rem]">
                <div>
                    <div className="flex items-start gap-3.5">
                        <span
                            className={`grid size-12 shrink-0 place-items-center rounded-xl ${
                                certificate.expired ? 'bg-locked-soft text-locked' : 'bg-earned-soft text-earned-ink'
                            }`}
                        >
                            <Award className="size-6" />
                        </span>

                        <div className="min-w-0">
                            <span
                                className={`block font-rubik text-label-xs-regular tracking-[0.1em] uppercase ${
                                    certificate.expired ? 'text-locked' : 'text-earned-ink'
                                }`}
                            >
                                {certificate.expired ? 'ใบรับรองหมดอายุแล้ว' : 'เรียนจบแล้ว · ผ่านแบบทดสอบทุกชุด'}
                            </span>
                            <h1 className="mt-1 text-h2 font-medium text-ink">{certificate.courseTitle}</h1>
                            <div className="mt-2 flex flex-wrap items-center gap-1.5">
                                <CategoryTag>{certificate.category}</CategoryTag>
                                <VersionTag>{certificate.version}</VersionTag>
                            </div>
                        </div>
                    </div>

                    <dl className="mt-5 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-label-m-regular">
                        <dt className="text-ink-3">เลขที่</dt>
                        <dd className="font-rubik tnum m-0 text-ink">{certificate.id}</dd>

                        <dt className="text-ink-3">ออกให้</dt>
                        <dd className="m-0 text-ink">
                            {certificate.holderName} <span className="text-ink-3">· {certificate.holderEmail}</span>
                        </dd>

                        <dt className="text-ink-3">วันที่ออก</dt>
                        <dd className="font-rubik tnum m-0 text-ink">{certificate.issuedOn}</dd>

                        <dt className="text-ink-3">หมดอายุ</dt>
                        <dd
                            className={`font-rubik tnum m-0 ${certificate.expired ? 'font-medium text-locked' : 'text-ink'}`}
                        >
                            {certificate.expiresOn}
                        </dd>

                        {certificate.score != null ? (
                            <>
                                <dt className="text-ink-3">คะแนนสอบ</dt>
                                <dd className="font-rubik tnum m-0 font-medium text-earned">{certificate.score}%</dd>
                            </>
                        ) : null}
                    </dl>

                    {/* An expired certificate's first action is renewal, not download — so the row
                        is rebuilt rather than reordered. */}
                    <div className="mt-5 flex flex-wrap items-center gap-2">
                        {certificate.expired ? (
                            <Link
                                href={`/courses/${id}`}
                                className="inline-flex items-center gap-2 rounded-lg bg-earned px-4 py-2 text-label-m-medium text-white hover:brightness-110"
                            >
                                <RotateCcw className="size-3.5" />
                                เรียนใหม่เพื่อต่ออายุ
                            </Link>
                        ) : null}
                        <span className="text-label-s-regular text-ink-3">
                            ปุ่มดาวน์โหลด PDF ยังไม่มี — รอ <code className="font-rubik">lms-srv</code> ออกไฟล์และ
                            signed URL
                        </span>
                    </div>
                </div>

                <CertificateFace certificate={certificate} />
            </div>

            {episodes.length > 0 ? (
                <section className="mt-7">
                    {/* Revision, not progression: the course is passed, so every episode is open and
                        the lock rule has nothing left to say. */}
                    <SectionHead title="ทบทวนเนื้อหา" count={`${episodes.length} ตอน · เปิดได้ทุกตอน`} />
                    <div className="overflow-hidden rounded-xl border border-line bg-panel shadow-(--shadow-panel)">
                        {episodes.map(episode => (
                            <ReviewRow key={episode.id} episode={episode} courseId={id} />
                        ))}
                    </div>
                </section>
            ) : null}

            <p className="mt-5 rounded-lg border border-line bg-panel px-4 py-3 text-label-s-regular text-ink-2">
                ใบรับรองผูกกับเวอร์ชัน <b className="font-rubik">{certificate.version}</b> ของคอร์สนี้ —
                ถ้าคอร์สออกเวอร์ชันใหม่ ใบเดิมยังใช้ได้จนหมดอายุ แต่จะมีแจ้งเตือนให้เรียนเนื้อหาส่วนที่เพิ่มเข้ามา
            </p>
        </>
    )
}

/**
 * One episode, reopened.
 *
 * A passed quiz reopens too, but what it offers is the answer key rather than another attempt —
 * retaking cannot improve a pass, and offering it would suggest otherwise.
 */
function ReviewRow({ episode, courseId }: { episode: Episode; courseId: string }) {
    const isQuiz = episode.kind === 'quiz'

    return (
        <Link
            href={`/courses/${courseId}?ep=${encodeURIComponent(episode.id)}`}
            className="flex items-center gap-2.5 border-t border-line-soft px-4 py-3 first:border-t-0 hover:bg-panel-2"
        >
            <EpisodeGlyph kind={episode.kind} size="sm" className="text-ink-3" />
            <span className="min-w-0 flex-1 text-label-m-regular text-ink">{episode.title}</span>
            <Chip tone={isQuiz ? 'ok' : 'neutral'}>{isQuiz ? 'ดูเฉลย' : 'ดูซ้ำ'}</Chip>
        </Link>
    )
}
