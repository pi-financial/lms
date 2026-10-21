import 'server-only'
import { auth } from '@libs/auth/config'
import type { Certificate, Course, CourseDetail, QuizAttempt } from './definitions'
import { COURSES, QUIZ_ATTEMPTS, TEAM_REPORT, certificateFor, certificatesFor, courseDetail } from './fixtures'

/**
 * Client for `lms-srv`, the service that owns the courses, progress and certificates.
 *
 * TODO(lms-srv): the service does not exist yet. Until `LMS_SRV_BASE_URL` is set, the readers
 * serve `./fixtures` — sample content copied from the mock, so the screens can be reviewed as
 * screens — and every writer throws `NotImplementedError`. The asymmetry is the point: a read that
 * shows sample data is a demo, while a write that silently succeeds against nothing tells a
 * learner their progress was saved when no service recorded it.
 *
 * Each screen says which of the two it is showing, because a demo indistinguishable from the real
 * thing is how invented numbers reach a compliance report.
 *
 * The shape follows `console-web/src/lib/ipo/client.ts`: the token is read from the session on the
 * server and attached per request. The browser never holds a service URL or a credential, and
 * `lms-srv` itself stays on the internal network — only this app and Entra are public.
 */

export class NotImplementedError extends Error {
    constructor(operation: string) {
        super(`lms-srv is not available yet: ${operation}`)
        this.name = 'NotImplementedError'
    }
}

/**
 * Base URL of the service. Server-only — no `NEXT_PUBLIC_` prefix, so the host cannot reach a
 * client bundle and from there the public internet.
 */
function baseUrl(): string {
    const url = process.env.LMS_SRV_BASE_URL
    if (!url) throw new NotImplementedError('LMS_SRV_BASE_URL is not set')
    return url.replace(/\/$/, '')
}

/**
 * One authenticated request.
 *
 * The learner's identity travels as the bearer token, never as a parameter: a service that accepts
 * an email in the body is a service where one learner can write another's progress.
 */
export async function lmsFetch<T>(path: string, init?: RequestInit): Promise<T> {
    const session = await auth()
    if (!session) throw new Error('Not authenticated')

    const res = await fetch(`${baseUrl()}${path}`, {
        ...init,
        headers: {
            'Content-Type': 'application/json',
            // TODO(lms-srv): confirm whether the service validates the Entra access token directly
            // or expects a service-to-service token minted here. The answer changes what is sent.
            ...init?.headers
        },
        cache: 'no-store'
    })

    if (!res.ok) throw new Error(`lms-srv ${res.status} ${init?.method ?? 'GET'} ${path}`)
    return res.json() as Promise<T>
}

/**
 * Whether the service is configured.
 *
 * Every reader below branches on this and serves `libs/api/fixtures.ts` when it is false, so the
 * screens render as real screens before `lms-srv` exists. The branch lives here rather than in a
 * page because here it is one line per endpoint and visible in one file; spread across the screens
 * it would be a decision each of them could get wrong, and a fixture a page imported directly is
 * one nothing would later remove.
 *
 * Writes do NOT get this treatment — see below.
 */
export function usingFixtures(): boolean {
    return !process.env.LMS_SRV_BASE_URL
}

// ── Courses ────────────────────────────────────────────────────────────────
// TODO(lms-srv): swap the fixture branch for the real call once the service exposes these.
// Shapes are in pi-elearning/api-design.html and migrations/003_from_mock.sql.

export async function listCourses(): Promise<Course[]> {
    if (usingFixtures()) return COURSES
    return lmsFetch<Course[]>('/api/v1/courses')
}

/** The course screen's read: the course, its outline and its attachments in one call. */
export async function getCourse(id: string): Promise<CourseDetail | undefined> {
    if (usingFixtures()) {
        const course = COURSES.find(c => c.id === id)
        return course && courseDetail(course)
    }
    return lmsFetch<CourseDetail>(`/api/v1/courses/${encodeURIComponent(id)}`)
}

// ── Progress ───────────────────────────────────────────────────────────────

/**
 * Heartbeat. Server decides whether the claimed position is credible; the client only reports.
 *
 * No fixture branch: a write that silently succeeds against nothing is worse than one that fails,
 * because the learner is then told their progress was saved when no service recorded it. Every
 * write below throws until the service exists.
 */
export async function postBeat(_episodeId: string, _position: number, _reason: string): Promise<never> {
    throw new NotImplementedError('postBeat')
}

// ── Quiz ───────────────────────────────────────────────────────────────────

export async function startQuiz(_episodeId: string): Promise<never> {
    throw new NotImplementedError('startQuiz')
}

export async function submitQuiz(_episodeId: string, _attemptId: string, _answers: unknown): Promise<never> {
    throw new NotImplementedError('submitQuiz')
}

/** Every attempt, passed or not — the results screen shows the record, not just the wins. */
export async function listQuizAttempts(): Promise<QuizAttempt[]> {
    if (usingFixtures()) return QUIZ_ATTEMPTS
    return lmsFetch<QuizAttempt[]>('/api/v1/quiz-attempts')
}

// ── Certificates ───────────────────────────────────────────────────────────

/**
 * The signed-in learner's certificates.
 *
 * Scoped to the session on the server, never to a parameter: an endpoint that takes an email is an
 * endpoint where one learner reads another's record. `lms-srv` resolves the holder from the bearer
 * token for the same reason.
 */
export async function listCertificates(): Promise<Certificate[]> {
    if (usingFixtures()) return certificatesFor((await auth())?.user?.email ?? undefined)
    return lmsFetch<Certificate[]>('/api/v1/certificates')
}

/**
 * The certificate this learner holds for one course, or `undefined`.
 *
 * `undefined` is an ordinary answer, not a failure: most learners hold no certificate for most
 * courses. The page turns it into a 404, which is the control — see `app/(app)/courses/[id]/
 * certificate/page.tsx`.
 */
export async function getCertificate(courseId: string): Promise<Certificate | undefined> {
    if (usingFixtures()) return certificateFor((await auth())?.user?.email ?? undefined, courseId)

    // A 404 from the service means the same thing as an empty fixture lookup: this learner has no
    // certificate for this course. Anything else is a real failure and is allowed to throw.
    try {
        return await lmsFetch<Certificate>(`/api/v1/certificates/course/${encodeURIComponent(courseId)}`)
    } catch (error) {
        if (error instanceof Error && error.message.includes(' 404 ')) return undefined
        throw error
    }
}

// ── Reports (editor) ───────────────────────────────────────────────────────

/**
 * One course's standing across the whole organisation.
 *
 * The App role is re-checked at the service, not only by `requireEditor()` on the page — a hidden
 * tab and a guarded route both stop at this app's boundary, and this endpoint reads every
 * employee's record.
 */
export async function getTeamReport(courseId?: string): Promise<typeof TEAM_REPORT> {
    if (usingFixtures()) return TEAM_REPORT
    return lmsFetch<typeof TEAM_REPORT>(`/api/v1/reports/course/${encodeURIComponent(courseId ?? '')}`)
}
