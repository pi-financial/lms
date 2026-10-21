import { auth } from '@libs/auth/config'
import { listCertificates, listCourses } from '@libs/api/lms-srv'
import { CompletedCard, CourseCard } from '@components/course-card'
import { FixtureNotice } from '@components/fixture-notice'
import { PageHead, SectionHead } from '@components/ui/section-head'

export const metadata = { title: 'แดชบอร์ด' }

/**
 * What this learner has open, and what they have finished.
 *
 * Unfinished courses come first and get the wider cards: a dashboard is a list of what is left to
 * do, and the finished ones are here to be looked up — for a certificate — rather than scanned.
 */
export default async function DashboardPage() {
    const [session, courses, certificates] = await Promise.all([auth(), listCourses(), listCertificates()])

    // Which finished courses this learner actually holds a certificate for. A card links to the
    // certificate page only when one exists: the page 404s otherwise, and a link that leads to a
    // 404 is worse than no link.

    const active = courses.filter(c => c.status === 'in-progress' || c.status === 'quiz-left')
    const completed = courses.filter(c => c.status === 'done')
    // The given name alone: "สวัสดี" with a full legal name reads like a letter from HR.
    const certifiedCourseIds = new Set(certificates.map(certificate => certificate.courseId))
    const greeting = (session?.user?.name ?? '').split(' ')[0]

    return (
        <>
            <FixtureNotice />

            <PageHead
                title={greeting ? `สวัสดี ${greeting}` : 'แดชบอร์ด'}
                summary={
                    active.length > 0
                        ? `มี ${active.length} คอร์สที่ยังเรียนไม่จบ`
                        : 'ไม่มีคอร์สค้างอยู่ — เรียนจบครบทุกคอร์สที่ลงทะเบียนไว้'
                }
            />

            {active.length > 0 ? (
                <section className="mb-8">
                    <SectionHead title="กำลังเรียน" count={`${active.length} คอร์ส`} />
                    <div className="grid gap-3.5 sm:grid-cols-[repeat(auto-fill,minmax(20rem,1fr))]">
                        {active.map(course => (
                            <CourseCard key={course.id} course={course} href={`/courses/${course.id}`} />
                        ))}
                    </div>
                </section>
            ) : null}

            {completed.length > 0 ? (
                <section>
                    <SectionHead title="เรียนจบแล้ว" count={`${completed.length} คอร์ส`} />
                    <div className="grid gap-3.5 sm:grid-cols-[repeat(auto-fill,minmax(15rem,1fr))]">
                        {completed.map(course => (
                            <CompletedCard
                                key={course.id}
                                course={course}
                                certificateHref={
                                    certifiedCourseIds.has(course.id) ? `/courses/${course.id}/certificate` : undefined
                                }
                            />
                        ))}
                    </div>
                </section>
            ) : null}
        </>
    )
}
