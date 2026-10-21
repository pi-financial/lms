import { PageHead } from '@components/ui/section-head'

/**
 * A screen that exists so the route and the tab are real, and says plainly that its data is not.
 *
 * What separates this from the screens that render fixtures: those have a shape worth reviewing —
 * a grid of cards, a list of certificates — and sample content is what makes the shape visible.
 * A screen left here has no shape yet, so inventing content for it would demo work that has not
 * been designed. Naming the service and the shape it owes is more useful to whoever picks it up.
 */
export function Placeholder({ title, summary, todo }: { title: string; summary: string; todo: string[] }) {
    return (
        <>
            <PageHead title={title} summary={summary} />

            <div className="rounded-xl border border-line bg-panel p-5 shadow-(--shadow-panel)">
                <h2 className="text-sub-hl font-medium text-ink">ยังไม่ได้สร้างหน้านี้</h2>
                <p className="mt-1 text-body-s text-ink-3">
                    รอ <code className="font-rubik">lms-srv</code> และการออกแบบหน้าจอ
                </p>

                <ul className="mt-4 flex list-disc flex-col gap-2 pl-5 text-body-s text-ink-2">
                    {todo.map(item => (
                        <li key={item}>{item}</li>
                    ))}
                </ul>
            </div>
        </>
    )
}
