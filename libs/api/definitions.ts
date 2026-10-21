/**
 * The shapes the screens render.
 *
 * Deliberately not the DTOs `lms-srv` will return — the service does not exist yet, and a type
 * invented to match a guess at its JSON would be wrong in a way that is hard to see. These are
 * what a *screen* needs, taken from `pi-elearning/mock/index.html` and
 * `pi-elearning/api-design.html`. When the service lands, the mapping work is in one place: a
 * function from its DTO to these, not a rewrite of every component.
 *
 * Pure module — no `server-only`, no imports — so a Client Component can hold one of these without
 * dragging a server dependency into the bundle.
 */

/** The product families a course belongs to. Also the axis the course list filters on. */
export const CATEGORIES = ['Structured Note', 'Bond', 'Mutual Fund', 'Compliance'] as const
export type Category = (typeof CATEGORIES)[number]

/**
 * Where a learner stands in a course.
 *
 * `quiz-left` is its own state rather than a `progress < 100`, because what remains is one
 * specific action — not "keep watching" — and the dashboard says so differently.
 */
export type CourseStatus = 'not-started' | 'in-progress' | 'quiz-left' | 'done'

/**
 * Which icon stands in for a piece of content.
 *
 * A name, not a glyph and not a component. Emoji were the obvious first choice and are the wrong
 * one: every platform draws its own — a 🔒 is flat and grey on one, glossy and gold on another, and
 * ▦ falls back to a box on a machine with no font covering it — so the same screen looks different
 * for every learner. These names resolve to `lucide-react` components at the point of render,
 * which draw from the stroke the rest of the interface uses.
 *
 * A component cannot travel here instead: this type crosses the server/client boundary inside
 * course data, and React refuses to serialise a function.
 */
export type MediaIcon = 'video' | 'deck' | 'quiz' | 'document' | 'secure' | 'overview'

export type Course = {
    id: string
    title: string
    category: Category
    /** `v2026.1` — the content version a certificate is issued against. */
    version: string
    /** Publication date of that version, already formatted for display. */
    versionDate?: string
    /** What the course is made of: `4 EP · วิดีโอ + เอกสาร`. */
    outline: string
    status: CourseStatus
    /** 0–100. A `done` course is always 100; a `quiz-left` one never is. */
    progress: number
    /** Where the learner stopped, for the dashboard's "continue" line. */
    resume?: string
    /** Set when `status` is `done`. */
    completedOn?: string
    /** False for courses that are required but issue no certificate. */
    certificate: boolean
    /**
     * Two CSS colours for the card's thumbnail gradient, and which icon is drawn on it. A thumbnail
     * image would be the real thing; until courses carry one, a generated gradient at least makes
     * the cards distinguishable at a glance.
     */
    art: { from: string; to: string; ink: string; icon: MediaIcon }
}

/**
 * A certificate, as issued to one person for one course.
 *
 * It is *not* a property of the course: two learners who finish the same course hold two different
 * certificates, and most learners hold none. That is why the reader takes a course id and an email
 * and may return nothing — a certificate page that renders from the course alone would show every
 * employee the same document with somebody else's name on it.
 */
export type Certificate = {
    /** The certificate number, printed on the document. */
    id: string
    /** The course it was issued against — what the page is reached by. */
    courseId: string
    courseTitle: string
    category: Category
    /**
     * The course version passed. A certificate is bound to it: when the course is revised the old
     * certificate stands until it expires, and the holder is asked to study what was added.
     */
    version: string
    /** Who holds it. The name is printed on the document; the email is the key. */
    holderName: string
    holderEmail: string
    issuedOn: string
    expiresOn: string
    /** True once `expiresOn` has passed. The record stands; only its validity lapsed. */
    expired: boolean
    /** Score on the final quiz, as a percentage — printed as part of the record. */
    score?: number
}

export type QuizAttempt = {
    id: string
    title: string
    courseTitle: string
    questions: number
    /** Pass mark, as a percentage. */
    threshold: number
    /** Best score across attempts, as a percentage. */
    score: number
    attempts: number
    takenOn: string
    passed: boolean
}

/** One employee's standing in a course, for the editor's team report. */
export type TeamMember = {
    id: string
    name: string
    /** Thai initials, for the avatar. */
    initials: string
    progress: number
    status: CourseStatus
}

/**
 * How many courses sit in each category, for the counts beside the filter chips.
 *
 * Here rather than in the page because it is the one place that knows a category count includes
 * `all` — a second implementation beside the chips is how `all` comes to mean "the filtered list"
 * and every chip reads 0 but the selected one.
 */
export function categoryCounts(courses: Course[]): Record<Category | 'all', number> {
    const counts = { all: courses.length } as Record<Category | 'all', number>
    for (const course of courses) {
        counts[course.category] = (counts[course.category] ?? 0) + 1
    }
    return counts
}

/**
 * One unit of a course: what a learner opens, and what completing it means.
 *
 * Three kinds, because completion is measured differently for each — a video by how much of its
 * runtime was watched, a deck by pages seen, a quiz by a score. Putting them behind one `progress`
 * number would make "80%" mean three different things.
 */
export type EpisodeKind = 'video' | 'deck' | 'quiz'

export type Episode = {
    id: string
    title: string
    kind: EpisodeKind
    /** True once this episode's own completion rule is satisfied. */
    done: boolean
    /** Runtime in seconds, and the furthest second watched. `video` only. */
    duration?: number
    watched?: number
    /** Page count, and the furthest page reached. `deck` only. */
    pages?: number
    pagesSeen?: number
    /** Question count, pass mark, and best score across attempts. `quiz` only. */
    questions?: number
    passMark?: number
    bestScore?: number | null
    /**
     * Watch URL for a `video`. A YouTube watch link — the player derives the embed URL from it, so
     * what an editor pastes is what they copied from the address bar.
     */
    videoUrl?: string
}

/**
 * A grouping of episodes with a title.
 *
 * A section owns no lock of its own and nothing completes "a section" as such — it is there so a
 * long course reads as an outline rather than a list of twenty rows. The sequence a learner walks
 * is the flat concatenation of every section's episodes, which is why the lock rule only ever
 * looks at the previous *episode*: two gates to keep in agreement is one too many, and a learner
 * stopped by one of them could not tell which.
 */
export type Section = {
    title: string
    episodes: Episode[]
}

/** A downloadable reference file. Never gated, and never counted as progress. */
export type Attachment = {
    id: string
    name: string
    /** `PDF · 2.4 MB · 38 หน้า` — already formatted, since nothing computes with it. */
    meta: string
    icon: MediaIcon
}

/** Everything the course screen needs that a course card does not. */
export type CourseDetail = Course & {
    sections: Section[]
    attachments: Attachment[]
    /**
     * Share of a video's runtime that has to be watched before it counts. Per course rather than
     * per episode: a learner is told one number before they start, and a rule that changed between
     * episodes could not be stated in a sentence.
     */
    watchPercent: number
}

/** The episodes of every section, in the order a learner walks them. */
export function flatEpisodes(sections: Section[]): Episode[] {
    return sections.flatMap(section => section.episodes)
}

/**
 * Whether episode `index` is reachable.
 *
 * The first always is; the rest wait on the one before. An editor reviewing the course is not
 * taking it — someone checking that EP 4 renders cannot be made to sit through EP 1–3 — so the
 * bypass opens every episode without touching what is recorded.
 */
export function isUnlocked(episodes: Episode[], index: number, bypass = false): boolean {
    if (index === 0 || bypass) return true
    return episodes[index - 1]?.done ?? false
}

/**
 * The video id in a YouTube watch link, or null.
 *
 * Accepts the three forms an editor might paste — `watch?v=`, `youtu.be/`, and an already-embedded
 * URL — and rejects anything else rather than letting an arbitrary string reach an iframe `src`.
 *
 * An id rather than a URL, because the player builds its own: the IFrame Player API needs
 * `enablejsapi` and `controls=0` on the embed, and a caller holding a finished URL would have to
 * take it apart to add them.
 */
export function youtubeVideoId(url: string | undefined): string | null {
    if (!url) return null

    let parsed: URL
    try {
        parsed = new URL(url)
    } catch {
        return null
    }

    const host = parsed.hostname.replace(/^www\./, '')
    const id =
        host === 'youtu.be'
            ? parsed.pathname.slice(1)
            : host === 'youtube.com' || host === 'm.youtube.com' || host === 'youtube-nocookie.com'
              ? (parsed.searchParams.get('v') ?? parsed.pathname.match(/^\/embed\/([^/]+)/)?.[1] ?? '')
              : ''

    // A video id is 11 characters of the URL-safe alphabet. Anything else is not one, and must not
    // reach an iframe `src`.
    return /^[\w-]{11}$/.test(id) ? id : null
}

/** `754` → `12:34`. */
export function formatDuration(seconds: number): string {
    const minutes = Math.floor(seconds / 60)
    const rest = Math.floor(seconds % 60)
    return `${minutes}:${String(rest).padStart(2, '0')}`
}
