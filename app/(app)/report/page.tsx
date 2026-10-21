import { requireEditor } from '@libs/auth/guard'
import type { TeamMember } from '@libs/api/definitions'
import { getTeamReport } from '@libs/api/lms-srv'
import { Chip } from '@components/ui/chip'
import { ProgressBar } from '@components/ui/progress-bar'
import { FixtureNotice } from '@components/fixture-notice'
import { PageHead, SectionHead, StatTile } from '@components/ui/section-head'

export const metadata = { title: 'ความคืบหน้าทีม' }

/**
 * One course's standing across the organisation.
 *
 * Totals first, then the per-person list: the question an editor opens this with is "how far off
 * is this course from done", and the names are what they drill into afterwards.
 */
export default async function ReportPage() {
    // The hidden tab is not the control — this is.
    await requireEditor()

    const report = await getTeamReport()

    return (
        <>
            <FixtureNotice />

            <PageHead title="ความคืบหน้าทีม" summary={report.courseTitle} />

            {/* `auto-fit` with an upper bound as well as a lower one. With `1fr` the four
                tiles divide the full width, and at 1600px each becomes ~390px of white around a
                two-digit number. Capping them stops that; `justify-start` then keeps the row
                left-aligned rather than floating four narrow tiles in the middle. */}
            <div className="mb-6 grid grid-cols-[repeat(auto-fit,minmax(10rem,14rem))] justify-start gap-3.5">
                <StatTile value={String(report.total)} label="พนักงานทั้งหมด" />
                <StatTile value={String(report.done)} label="เรียนจบแล้ว" tone="earned" />
                <StatTile value={String(report.inProgress)} label="กำลังเรียน" />
                <StatTile value={String(report.notStarted)} label="ยังไม่เริ่ม" tone="locked" />
            </div>

            <div className="rounded-xl border border-line bg-panel p-5 shadow-(--shadow-panel)">
                <SectionHead title="รายคน" count={`${report.members.length} คน`} />
                <ul className="flex flex-col gap-3">
                    {report.members.map(member => (
                        <li key={member.id}>
                            <MemberRow member={member} />
                        </li>
                    ))}
                </ul>
            </div>
        </>
    )
}

function MemberRow({ member }: { member: TeamMember }) {
    return (
        <div className="flex items-center gap-3">
            <span
                aria-hidden
                className="grid size-7 shrink-0 place-items-center rounded-full bg-panel-2 text-label-xs-regular text-ink-2"
            >
                {member.initials}
            </span>

            <div className="min-w-0 flex-1">
                <div className="truncate text-label-m-regular text-ink">{member.name}</div>
                <ProgressBar className="mt-1" value={member.progress} label={`ความคืบหน้าของ ${member.name}`} />
            </div>

            {/* The two ends of the scale get a word, because "100%" and "0%" are the two figures an
                editor acts on and a bar alone does not distinguish "finished" from "nearly". */}
            {member.status === 'done' ? (
                <Chip tone="ok" className="shrink-0">
                    จบแล้ว
                </Chip>
            ) : member.status === 'not-started' ? (
                <Chip tone="warn" className="shrink-0">
                    ยังไม่เริ่ม
                </Chip>
            ) : (
                <span className="font-rubik tnum shrink-0 text-label-s-regular text-ink-3">{member.progress}%</span>
            )}
        </div>
    )
}
