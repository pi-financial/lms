import { CATEGORIES, categoryCounts, type Category } from '@libs/api/definitions'
import { listCourses } from '@libs/api/lms-srv'
import { CourseCard } from '@components/course-card'
import { FixtureNotice } from '@components/fixture-notice'
import { PageHead } from '@components/ui/section-head'
import { CategoryFilter } from './category-filter'

export const metadata = { title: 'คอร์สทั้งหมด' }

/** Anything not one of the five categories is treated as no filter at all. */
function parseCategory(raw: string | string[] | undefined): Category | 'all' {
    const value = Array.isArray(raw) ? raw[0] : raw
    return CATEGORIES.includes(value as Category) ? (value as Category) : 'all'
}

/**
 * Every published course, filtered by product category.
 *
 * The filter lives in the query string rather than in component state, so the server renders the
 * filtered list directly: no loading flash, and `/courses?cat=Bond` is a URL that survives being
 * pasted into a chat.
 */
export default async function CoursesPage({
    searchParams
}: {
    searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
    const [query, courses] = await Promise.all([searchParams, listCourses()])

    const active = parseCategory(query.cat)
    const visible = active === 'all' ? courses : courses.filter(course => course.category === active)
    // Counted from the whole list, not the filtered one — a chip showing 0 while it is selected
    // would be counting its own result.
    const counts = categoryCounts(courses)

    const base = '/courses'

    return (
        <>
            <FixtureNotice />

            <PageHead
                title="คอร์สทั้งหมด"
                summary="พนักงานที่ยังไม่ลาออกเข้าเรียนได้ทุกคอร์ส — ไม่ต้องรอ assign และไม่จำกัดตามตำแหน่งหรือใบอนุญาต"
            />

            <CategoryFilter
                counts={counts}
                active={active}
                hrefFor={category => (category === 'all' ? base : `${base}?cat=${encodeURIComponent(category)}`)}
            />

            {visible.length === 0 ? (
                <p className="py-8 text-center text-body-m text-ink-3">ยังไม่มีคอร์สในหมวดนี้</p>
            ) : (
                <div className="grid gap-3.5 sm:grid-cols-[repeat(auto-fill,minmax(20rem,1fr))]">
                    {visible.map(course => (
                        <CourseCard key={course.id} course={course} href={`/courses/${course.id}`} />
                    ))}
                </div>
            )}
        </>
    )
}
