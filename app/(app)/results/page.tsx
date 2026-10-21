import type { Certificate, QuizAttempt } from '@libs/api/definitions'
import { listCertificates, listQuizAttempts } from '@libs/api/lms-srv'
import Link from 'next/link'
import { Award, Check, X } from 'lucide-react'
import { CategoryTag, VersionTag } from '@components/ui/chip'
import { FixtureNotice } from '@components/fixture-notice'
import { PageHead, SectionHead, StatTile } from '@components/ui/section-head'
import { cn } from '@libs/ui/cn'

export const metadata = { title: 'ผลสอบและใบรับรอง' }

/**
 * What this learner has earned, and the record behind it.
 *
 * Certificates first: they are the outcome someone comes to this page for, where the attempt log
 * is the evidence underneath. The log shows failures too — a results page that lists only passes
 * is not a record, and a learner who has to retake something needs to find it here.
 */
export default async function ResultsPage() {
    const [certificates, attempts] = await Promise.all([listCertificates(), listQuizAttempts()])

    const passed = attempts.filter(a => a.passed)
    const failed = attempts.filter(a => !a.passed)
    const average =
        attempts.length > 0 ? Math.round(attempts.reduce((sum, a) => sum + a.score, 0) / attempts.length) : 0

    return (
        <>
            <FixtureNotice />

            <PageHead title="ผลสอบและใบรับรอง" summary="ผลการทำแบบทดสอบทุกชุดของคุณ และใบรับรองที่ได้รับ" />

            {/* `auto-fit` with an upper bound as well as a lower one. With `1fr` the four
                tiles divide the full width, and at 1600px each becomes ~390px of white around a
                two-digit number. Capping them stops that; `justify-start` then keeps the row
                left-aligned rather than floating four narrow tiles in the middle. */}
            <div className="mb-7 grid grid-cols-[repeat(auto-fit,minmax(9rem,14rem))] justify-start gap-3.5">
                <StatTile value={String(passed.length)} label="สอบผ่าน" tone="earned" />
                <StatTile
                    value={String(failed.length)}
                    label="ยังไม่ผ่าน"
                    tone={failed.length > 0 ? 'locked' : 'plain'}
                />
                <StatTile value={`${average}%`} label="คะแนนเฉลี่ย" />
                <StatTile value={String(certificates.filter(c => !c.expired).length)} label="ใบรับรองที่ใช้ได้" />
            </div>

            <section className="mb-8">
                <SectionHead title="ใบรับรอง" count={`${certificates.length} ใบ`} />
                {certificates.length === 0 ? (
                    <p className="py-8 text-center text-body-m text-ink-3">
                        ยังไม่มีใบรับรอง — เรียนจบคอร์สแล้วจะออกให้อัตโนมัติ
                    </p>
                ) : (
                    <div className="grid gap-3.5 sm:grid-cols-[repeat(auto-fill,minmax(15rem,1fr))]">
                        {certificates.map(certificate => (
                            <CertificateCard key={certificate.id} certificate={certificate} />
                        ))}
                    </div>
                )}
            </section>

            <section>
                <SectionHead title="ประวัติการทำแบบทดสอบ" count={`${attempts.length} ชุด`} />
                <div className="overflow-hidden rounded-xl border border-line bg-panel shadow-(--shadow-panel)">
                    {attempts.map(attempt => (
                        <AttemptRow key={attempt.id} attempt={attempt} />
                    ))}
                </div>
            </section>
        </>
    )
}

/**
 * One certificate.
 *
 * An expired one keeps its card rather than being hidden or greyed out: the record still stands,
 * only its validity lapsed, and what the learner has to do about it — retake the course — is only
 * discoverable if the card is findable among the valid ones. Hence the warning border, which is
 * what makes it stand out in a grid rather than recede into it.
 */
function CertificateCard({ certificate }: { certificate: Certificate }) {
    return (
        // A link, because the card is a summary of a document that has its own page — and the
        // learner holds this one, so the destination is guaranteed to exist.
        <Link
            href={`/courses/${certificate.courseId}/certificate`}
            className={cn(
                'flex flex-col gap-3 rounded-xl border bg-panel p-4 shadow-(--shadow-panel)',
                'transition-[border-color,transform] duration-150 hover:-translate-y-px',
                certificate.expired ? 'border-locked' : 'border-line hover:border-earned'
            )}
        >
            <span
                aria-hidden
                className={cn(
                    'grid size-9 place-items-center rounded-lg text-[1.1rem]',
                    certificate.expired ? 'bg-locked-soft' : 'bg-earned-soft'
                )}
            >
                <Award className={cn('size-4', certificate.expired ? 'text-locked' : 'text-earned-ink')} />
            </span>

            <h3 className="text-label-m-medium text-ink">{certificate.courseTitle}</h3>

            <div className="flex flex-wrap items-center gap-1.5">
                <CategoryTag>{certificate.category}</CategoryTag>
                <VersionTag>{certificate.version}</VersionTag>
            </div>

            {/* A description list, not a table: three label/value pairs about one subject is what
                `<dl>` is, and a screen reader then reads each value with its own label. */}
            <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-0.5 text-label-s-regular">
                <dt className="text-ink-3">ออกให้เมื่อ</dt>
                <dd className="font-rubik tnum m-0 text-right text-ink-2">{certificate.issuedOn}</dd>

                <dt className="text-ink-3">หมดอายุ</dt>
                <dd
                    className={cn(
                        'font-rubik tnum m-0 text-right',
                        certificate.expired ? 'font-medium text-locked' : 'text-ink-2'
                    )}
                >
                    {certificate.expiresOn}
                    {certificate.expired ? ' · หมดอายุแล้ว' : ''}
                </dd>

                <dt className="text-ink-3">เลขที่</dt>
                <dd className="font-rubik tnum m-0 text-right text-ink-2">{certificate.id}</dd>
            </dl>
        </Link>
    )
}

/**
 * One quiz attempt in the log.
 *
 * The score is the column the eye runs down, so it is the one thing set larger, and it is coloured
 * by outcome — but the tick, the cross and the subtitle carry the same fact, so the colour is
 * never the only thing saying whether this was a pass.
 */
function AttemptRow({ attempt }: { attempt: QuizAttempt }) {
    return (
        <div className="flex flex-wrap items-center gap-3 border-t border-line-soft px-4 py-3 first:border-t-0">
            <span
                aria-hidden
                className={cn(
                    'grid size-5.5 shrink-0 place-items-center rounded-full text-label-xs-regular text-white',
                    attempt.passed ? 'bg-earned' : 'bg-locked'
                )}
            >
                {attempt.passed ? <Check className="size-2.5" /> : <X className="size-2.5" />}
            </span>

            <span className="min-w-0 flex-1 basis-full sm:basis-auto">
                <span className="block text-label-m-regular text-ink">{attempt.title}</span>
                <span className="block text-label-s-regular text-ink-3">
                    {attempt.courseTitle} · {attempt.questions} ข้อ · เกณฑ์ผ่าน {attempt.threshold}%
                    {attempt.attempts > 1 ? ` · ทำ ${attempt.attempts} ครั้ง · คะแนนดีที่สุด` : ''}
                </span>
            </span>

            <span className="font-rubik tnum shrink-0 text-label-s-regular text-ink-3">{attempt.takenOn}</span>

            <span
                className={cn(
                    'font-rubik tnum min-w-12 shrink-0 text-right text-sub-hl font-medium',
                    attempt.passed ? 'text-earned' : 'text-locked'
                )}
            >
                {attempt.score}%<span className="sr-only">{attempt.passed ? ' — ผ่าน' : ' — ไม่ผ่าน'}</span>
            </span>
        </div>
    )
}
