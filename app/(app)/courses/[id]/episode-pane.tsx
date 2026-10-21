import { youtubeVideoId, type Episode } from '@libs/api/definitions'
import { Shuffle } from 'lucide-react'
import { VideoPlayer } from '@components/player/video-player'
import { Chip } from '@components/ui/chip'
import { ProgressBar } from '@components/ui/progress-bar'

/**
 * The episode itself.
 *
 * Three panes, picked by kind. Each says what it can honestly say today: the video actually plays,
 * because the embed needs nothing from `lms-srv`; the deck and the quiz describe what they will be
 * and name what is missing, because inventing a page viewer or a working quiz would demo a service
 * contract that has not been agreed.
 */
export function EpisodePane({
    episode,
    watchPercent,
    bypass
}: {
    episode: Episode
    watchPercent: number
    bypass: boolean
}) {
    if (episode.kind === 'video') return <VideoPane episode={episode} watchPercent={watchPercent} bypass={bypass} />
    if (episode.kind === 'deck') return <DeckPane episode={episode} />
    return <QuizPane episode={episode} />
}

/**
 * The player.
 *
 * `VideoPlayer` is a Client Component — it drives the YouTube IFrame API and holds the watch mark —
 * so everything it needs arrives as props from here, which stays on the server.
 *
 * TODO(lms-srv): the mark is seeded from what the service last recorded and is lost on unmount,
 * because `postBeat` does not exist yet. Until it does, a reload gives back the time already
 * watched in this session — which is why the gate is the client's to hold today and the server's
 * to prove tomorrow.
 */
function VideoPane({ episode, watchPercent, bypass }: { episode: Episode; watchPercent: number; bypass: boolean }) {
    const videoId = youtubeVideoId(episode.videoUrl)

    if (!videoId) {
        return (
            <div className="overflow-hidden rounded-xl border border-line bg-panel shadow-(--shadow-panel)">
                <div className="grid aspect-video w-full place-items-center bg-[#12282E] px-6 text-center text-body-s text-white/60">
                    ตอนนี้ยังไม่ได้ใส่ลิงก์วิดีโอ
                </div>
            </div>
        )
    }

    return (
        // `key`: the player builds itself once on mount and never re-reads its props, which is what
        // keeps a re-render from tearing down a video mid-watch. Moving to another episode has to
        // build a new one, and the key is what tells React that is what happened.
        <VideoPlayer
            key={episode.id}
            videoId={videoId}
            title={episode.title}
            initialWatched={episode.watched ?? 0}
            watchPercent={watchPercent}
            bypass={bypass}
        />
    )
}

/**
 * The deck, as it will be.
 *
 * TODO(lms-srv): a page viewer, with the same lock rule as the video measured in pages — page N+1
 * opens once page N has been seen — plus the dwell clock, so clicking through twenty pages in ten
 * seconds does not complete anything. Needs the file to be served through a short-lived presigned
 * URL rather than from a public bucket.
 */
function DeckPane({ episode }: { episode: Episode }) {
    const pages = episode.pages ?? 0
    const seen = episode.pagesSeen ?? 0

    return (
        <div className="overflow-hidden rounded-xl border border-line bg-panel shadow-(--shadow-panel)">
            <div className="grid aspect-[4/3] place-items-center bg-panel-2 px-6 text-center">
                <div>
                    <div className="font-rubik tnum text-display1 text-ink-3">{seen}</div>
                    <p className="mt-1 text-body-s text-ink-3">
                        ตัวอ่านสไลด์ยังไม่ได้สร้าง — รอ <code className="font-rubik">lms-srv</code> และ presigned URL
                        ของไฟล์
                    </p>
                </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 border-t border-line px-4 py-3">
                <ProgressBar
                    className="min-w-45 flex-1"
                    value={pages > 0 ? (seen / pages) * 100 : 0}
                    label={`ความคืบหน้า ${episode.title}`}
                />
                <span className="font-rubik tnum text-label-s-regular text-ink-2">
                    {seen} / {pages}
                </span>
            </div>
        </div>
    )
}

/**
 * The quiz, as it will be.
 *
 * TODO(lms-srv): `startQuiz` returns the questions with their order and choices already shuffled —
 * by the server, since a client that shuffles is a client that holds the answer key — and
 * `submitQuiz` grades. Neither exists, so nothing here is answerable yet.
 */
function QuizPane({ episode }: { episode: Episode }) {
    return (
        <div className="rounded-xl border border-line bg-panel p-5 shadow-(--shadow-panel)">
            <div className="mb-2 flex flex-wrap items-baseline gap-3">
                <h2 className="text-sub-hl font-medium text-ink">{episode.title}</h2>
                <span className="text-label-s-regular text-ink-3">
                    {episode.questions ?? 0} ข้อ · เกณฑ์ผ่าน {episode.passMark ?? 0}%
                </span>
                <Chip tone="warn" className="ml-auto">
                    <Shuffle className="size-2.5" />
                    สลับข้อ · สลับตัวเลือก
                </Chip>
            </div>

            {episode.bestScore != null ? (
                <p className="mb-3 text-body-s text-ink-2">
                    คะแนนดีที่สุดที่ทำได้ <span className="font-rubik tnum font-medium">{episode.bestScore}%</span>
                </p>
            ) : null}

            <p className="text-body-s text-ink-3">
                แบบทดสอบยังทำไม่ได้ — รอ <code className="font-rubik">lms-srv</code> ส่งคำถามที่สลับลำดับมาจาก server
                และรับคำตอบไปตรวจ ตัวข้อสอบไม่ถูกส่งมาที่เบราว์เซอร์พร้อมเฉลย
            </p>
        </div>
    )
}
