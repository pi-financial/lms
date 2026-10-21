import type { Attachment, Certificate, Course, CourseDetail, QuizAttempt, Section, TeamMember } from './definitions'

/**
 * The sample content behind every screen, copied from `pi-elearning/mock/index.html`.
 *
 * It exists so the shell can be reviewed as a real screen rather than as a column of empty states:
 * a grid of cards shows whether the layout holds at seven courses and whether an expired
 * certificate is findable among valid ones, and an empty page shows neither.
 *
 * It is *not* a stand-in for the service. Every reader goes through `libs/api/lms-srv.ts`, which
 * returns this while `LMS_SRV_BASE_URL` is unset and calls the service once it is — so the swap is
 * one file, and no component learns that a fixture ever existed. The banner on each screen says
 * which of the two the reader is looking at, because a demo that cannot be told apart from the
 * real thing is how invented numbers reach a compliance report.
 *
 * Dates are pre-formatted Thai strings rather than `Date` objects: nothing here computes with
 * them, and a literal is what makes the fixture diff-able against the mock it came from.
 */

export const COURSES: Course[] = [
    {
        id: 'aml-2026',
        title: 'การป้องกันการฟอกเงิน (AML) 2026',
        category: 'Compliance',
        version: 'v2026.1',
        versionDate: '12 ต.ค. 2026',
        outline: '4 EP · วิดีโอ + เอกสาร',
        status: 'in-progress',
        progress: 34,
        resume: 'EP 2 · วิดีโอ 12:40 นาที',
        certificate: true,
        art: { from: '#123b45', to: '#2b7f74', ink: '#cfe9e6', icon: 'video' }
    },
    {
        id: 'sn-basics',
        title: 'ความรู้พื้นฐาน Structured Note',
        category: 'Structured Note',
        version: 'v2026.2',
        versionDate: '8 ต.ค. 2026',
        outline: '4 EP · วิดีโอ + สไลด์',
        // The state this status exists for: the bar is nearly full, the course is not done, and
        // what remains is one quiz rather than more watching.
        status: 'quiz-left',
        progress: 86,
        resume: 'ดูเนื้อหาครบแล้ว · เหลือแบบทดสอบ 1 ชุด',
        certificate: true,
        art: { from: '#3d2a1c', to: '#8a5a33', ink: '#f5ddc8', icon: 'quiz' }
    },
    {
        id: 'sn-suitability',
        title: 'การขาย SN ให้เหมาะกับลูกค้า',
        category: 'Structured Note',
        version: 'v2026.1',
        versionDate: '14 ต.ค. 2026',
        outline: '3 EP · สไลด์ + แบบทดสอบ',
        status: 'not-started',
        progress: 0,
        certificate: true,
        art: { from: '#33243f', to: '#6d4a84', ink: '#e8d8f2', icon: 'deck' }
    },
    {
        id: 'bond-basics',
        title: 'หุ้นกู้และพันธบัตรเบื้องต้น',
        category: 'Bond',
        version: 'v2026.1',
        versionDate: '2 ต.ค. 2026',
        outline: '5 EP · วิดีโอ + เอกสาร',
        status: 'in-progress',
        progress: 18,
        resume: 'EP 1 · วิดีโอ 8:05 นาที',
        certificate: true,
        art: { from: '#1d3a2a', to: '#2e7a52', ink: '#cfe9d8', icon: 'video' }
    },
    {
        id: 'mutual-fund',
        title: 'กองทุนรวมและการจัดพอร์ต',
        category: 'Mutual Fund',
        version: 'v2026.3',
        versionDate: '16 ต.ค. 2026',
        outline: '6 EP · สไลด์ + แบบทดสอบ',
        status: 'not-started',
        progress: 0,
        certificate: true,
        art: { from: '#3a2f1d', to: '#7a5a2e', ink: '#f0e2c8', icon: 'deck' }
    },
    {
        id: 'pdpa',
        title: 'ความปลอดภัยข้อมูลส่วนบุคคล (PDPA)',
        category: 'Compliance',
        version: 'v2025.4',
        versionDate: '18 ก.ย. 2026',
        outline: '4 EP · เอกสาร PDF',
        status: 'done',
        progress: 100,
        completedOn: '2 ต.ค. 2026',
        certificate: true,
        art: { from: '#1f3340', to: '#44667d', ink: '#d6e6f0', icon: 'document' }
    },
    {
        id: 'cybersecurity',
        title: 'Cybersecurity Awareness',
        category: 'Compliance',
        version: 'v2026.1',
        versionDate: '5 ต.ค. 2026',
        outline: '5 EP · วิดีโอ',
        status: 'not-started',
        progress: 0,
        certificate: true,
        art: { from: '#2b2438', to: '#574a6e', ink: '#ded6ee', icon: 'secure' }
    },
    {
        id: 'staff-trading',
        title: 'ระเบียบการซื้อขายหลักทรัพย์ของพนักงาน',
        category: 'Compliance',
        version: 'v2025.2',
        versionDate: '18 ก.ย. 2025',
        outline: '3 EP · เอกสาร PDF',
        status: 'done',
        progress: 100,
        completedOn: '18 ก.ย. 2026',
        certificate: true,
        art: { from: '#3a2b1d', to: '#6d542f', ink: '#f0e0c6', icon: 'document' }
    },
    {
        id: 'orientation',
        title: 'ปฐมนิเทศพนักงานใหม่',
        category: 'Compliance',
        version: 'v2026.1',
        versionDate: '1 ส.ค. 2026',
        outline: '2 EP · วิดีโอ',
        status: 'done',
        progress: 100,
        completedOn: '5 ส.ค. 2026',
        // Required, but issues nothing — the results screen has to say so rather than leave a
        // learner looking for a certificate that was never going to exist.
        certificate: false,
        art: { from: '#24323a', to: '#4e6b78', ink: '#d8e8ef', icon: 'overview' }
    }
]

/**
 * Certificates, by holder.
 *
 * Keyed by email rather than a flat list, because a certificate belongs to a person and the screens
 * turn on who is asking: `dev.learner@pi.co.th` holds three, `dev.editor@pi.co.th` holds none. The
 * second case is the one worth having in the fixture — a certificate page that was only ever built
 * against a learner who holds one is a page whose "you do not have this" path has never run.
 */
const CERTIFICATES_BY_HOLDER: Record<string, Certificate[]> = {
    'dev.learner@pi.co.th': [
        {
            id: 'PI-AML-2026-0147',
            courseId: 'aml-2026',
            courseTitle: 'การป้องกันการฟอกเงิน (AML) 2026',
            category: 'Compliance',
            version: 'v2026.1',
            holderName: 'Dev Learner',
            holderEmail: 'dev.learner@pi.co.th',
            issuedOn: '12 ต.ค. 2026',
            expiresOn: '12 ต.ค. 2027',
            expired: false,
            score: 100
        },
        {
            id: 'PI-PDPA-2026-0912',
            courseId: 'pdpa',
            courseTitle: 'ความปลอดภัยข้อมูลส่วนบุคคล (PDPA)',
            category: 'Compliance',
            version: 'v2025.4',
            holderName: 'Dev Learner',
            holderEmail: 'dev.learner@pi.co.th',
            issuedOn: '2 ต.ค. 2026',
            expiresOn: '2 ต.ค. 2027',
            expired: false,
            score: 90
        },
        {
            // The state worth surfacing: the course has to be retaken, and nothing else on the
            // page says so.
            id: 'PI-STAFF-2025-0455',
            courseId: 'staff-trading',
            courseTitle: 'ระเบียบการซื้อขายหลักทรัพย์ของพนักงาน',
            category: 'Compliance',
            version: 'v2025.2',
            holderName: 'Dev Learner',
            holderEmail: 'dev.learner@pi.co.th',
            issuedOn: '18 ก.ย. 2025',
            expiresOn: '18 ก.ย. 2026',
            expired: true,
            score: 83
        }
    ]
}

/** This learner's certificates, newest first. Nobody else's, and empty is a normal answer. */
export function certificatesFor(email: string | undefined): Certificate[] {
    return CERTIFICATES_BY_HOLDER[(email ?? '').toLowerCase()] ?? []
}

/** The certificate this learner holds for one course, or nothing. */
export function certificateFor(email: string | undefined, courseId: string): Certificate | undefined {
    return certificatesFor(email).find(certificate => certificate.courseId === courseId)
}

export const QUIZ_ATTEMPTS: QuizAttempt[] = [
    {
        id: 'aml-final',
        title: 'แบบทดสอบท้ายคอร์ส',
        courseTitle: 'การป้องกันการฟอกเงิน (AML) 2026',
        questions: 3,
        threshold: 70,
        score: 100,
        attempts: 1,
        takenOn: '12 ต.ค. 2026',
        passed: true
    },
    {
        id: 'aml-case',
        title: 'ทบทวนกรณีศึกษา',
        courseTitle: 'การป้องกันการฟอกเงิน (AML) 2026',
        questions: 1,
        threshold: 60,
        score: 100,
        attempts: 2,
        takenOn: '12 ต.ค. 2026',
        passed: true
    },
    {
        id: 'pdpa-final',
        title: 'แบบทดสอบ PDPA',
        courseTitle: 'ความปลอดภัยข้อมูลส่วนบุคคล (PDPA)',
        questions: 10,
        threshold: 80,
        score: 90,
        attempts: 1,
        takenOn: '2 ต.ค. 2026',
        passed: true
    },
    {
        // Not passed: the score is the best of three, and the action is to retake rather than to
        // review an answer key.
        id: 'cyber-final',
        title: 'แบบทดสอบ Cybersecurity',
        courseTitle: 'Cybersecurity Awareness',
        questions: 12,
        threshold: 80,
        score: 67,
        attempts: 3,
        takenOn: '15 ต.ค. 2026',
        passed: false
    },
    {
        id: 'staff-final',
        title: 'แบบทดสอบระเบียบการซื้อขาย',
        courseTitle: 'ระเบียบการซื้อขายหลักทรัพย์ของพนักงาน',
        questions: 6,
        threshold: 70,
        score: 83,
        attempts: 1,
        takenOn: '18 ก.ย. 2025',
        passed: true
    }
]

/** The team report is scoped to one course at a time; this is the one it opens on. */
export const TEAM_REPORT = {
    courseTitle: 'การป้องกันการฟอกเงิน (AML) 2026',
    total: 142,
    done: 88,
    inProgress: 39,
    notStarted: 15,
    members: [
        { id: '1', name: 'ธนกร วงศ์ประเสริฐ', initials: 'ธน', progress: 100, status: 'done' },
        { id: '2', name: 'ศิริพร ใจดี', initials: 'ศิ', progress: 67, status: 'in-progress' },
        { id: '3', name: 'ประวิทย์ สุขสันต์', initials: 'ปร', progress: 12, status: 'in-progress' },
        { id: '4', name: 'อรุณี พัฒนกิจ', initials: 'อร', progress: 0, status: 'not-started' }
    ] satisfies TeamMember[]
}

/**
 * The AML course's episodes and attachments, from the `s-player` section of the mock.
 *
 * Only this one course is spelled out. The other eight render a course page that says its outline
 * has not been authored yet — which is the honest state, and better than eight copies of the same
 * invented episode list implying the content exists.
 *
 * The YouTube link is a real one so the embed can actually be seen working; nothing about the
 * video's content is meant to match the course title.
 */
const AML_SECTIONS: Section[] = [
    {
        title: 'พื้นฐานที่ต้องรู้ก่อน',
        episodes: [
            {
                id: 'aml-ep1',
                title: 'ความรู้พื้นฐานเรื่องการฟอกเงิน',
                kind: 'video',
                done: true,
                duration: 540,
                watched: 540,
                videoUrl: 'https://www.youtube.com/watch?v=I_oMJk6barY'
            },
            {
                id: 'aml-ep2',
                title: 'ขั้นตอนการรายงานธุรกรรมที่น่าสงสัย',
                kind: 'video',
                done: false,
                duration: 760,
                watched: 258,
                videoUrl: 'https://www.youtube.com/watch?v=I_oMJk6barY'
            }
        ]
    },
    {
        // A section mixing all three kinds — the thing the structure exists to allow.
        title: 'กรณีศึกษาและเอกสารอ้างอิง',
        episodes: [
            {
                id: 'aml-ep3',
                title: 'สไลด์บรรยาย — กรณีศึกษาจากเหตุการณ์จริง',
                kind: 'deck',
                done: false,
                pages: 24,
                pagesSeen: 1
            },
            { id: 'aml-ep4', title: 'คู่มือ AML ฉบับเต็ม', kind: 'deck', done: false, pages: 12, pagesSeen: 1 },
            {
                // A quiz sitting mid-course, not only at the end: it gates what follows it exactly
                // as a video does.
                id: 'aml-ep5',
                title: 'ทบทวนกรณีศึกษา',
                kind: 'quiz',
                done: false,
                questions: 1,
                passMark: 60,
                bestScore: null
            }
        ]
    },
    {
        title: 'วัดผล',
        episodes: [
            {
                id: 'aml-ep6',
                title: 'แบบทดสอบท้ายคอร์ส',
                kind: 'quiz',
                done: false,
                questions: 4,
                passMark: 70,
                bestScore: null
            }
        ]
    }
]

const AML_ATTACHMENTS: Attachment[] = [
    { id: 'handbook', name: 'คู่มือ AML ฉบับเต็ม 2026', meta: 'PDF · 2.4 MB · 38 หน้า', icon: 'document' },
    { id: 'str-form', name: 'แบบฟอร์มรายงานธุรกรรมที่น่าสงสัย (STR)', meta: 'PDF · 420 KB · 4 หน้า', icon: 'document' },
    { id: 'slides', name: 'สไลด์ประกอบการบรรยาย', meta: 'PDF · 8.1 MB · 24 สไลด์', icon: 'deck' }
]

/** The per-course detail, for the courses that have one authored. */
const DETAILS: Record<string, { sections: Section[]; attachments: Attachment[] }> = {
    'aml-2026': { sections: AML_SECTIONS, attachments: AML_ATTACHMENTS }
}

/**
 * A course with its outline, or with an empty one.
 *
 * Empty sections are not a failure — the course page renders a note saying the outline has not
 * been authored — so this returns a `CourseDetail` either way rather than making every caller
 * handle two shapes.
 */
export function courseDetail(course: Course): CourseDetail {
    const detail = DETAILS[course.id]
    return {
        ...course,
        sections: detail?.sections ?? [],
        attachments: detail?.attachments ?? [],
        watchPercent: 80
    }
}
