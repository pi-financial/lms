import { usingFixtures } from '@libs/api/lms-srv'

/**
 * Says, on the screen itself, that the numbers below are sample content.
 *
 * The screens are built against `libs/api/fixtures.ts` until `lms-srv` exists, and a screen full
 * of plausible Thai course titles and percentages is indistinguishable from a working one. That is
 * fine in a design review and dangerous anywhere else — a screenshot of this page could otherwise
 * be read as a compliance record.
 *
 * Renders nothing once `LMS_SRV_BASE_URL` is set, so removing it is not a step anyone has to
 * remember: the banner disappears at the moment the data stops being invented.
 */
export function FixtureNotice() {
    if (!usingFixtures()) return null

    return (
        <p
            role="note"
            className="mb-5 rounded-lg border border-locked/30 bg-locked-soft px-3 py-2 text-label-s-regular text-locked"
        >
            ข้อมูลตัวอย่าง — ยังไม่ได้ต่อ <code className="font-rubik">lms-srv</code> ตัวเลขทุกตัวในหน้านี้เป็นของสมมติ
            ดูรายละเอียดที่ INFRA-REQUEST.md
        </p>
    )
}
