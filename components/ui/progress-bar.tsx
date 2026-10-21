import { cn } from '@libs/ui/cn'

/**
 * How much of a course has actually been completed.
 *
 * The filled length is the whole point of the screen, so it is drawn in the earned colour and the
 * track is inert — the bar is never decorative, and a full one always means finished.
 *
 * A real `<progress>`, styled through the pseudo-elements in `globals.css`: every browser already
 * announces it with its value, where a `<div role="progressbar">` only works if each of the four
 * aria attributes is remembered at every call site. `label` names which course the figure belongs
 * to, since a page carries several.
 */
export function ProgressBar({ value, label, className }: { value: number; label: string; className?: string }) {
    // The server is the source of this number, but it comes from a service — a bad one must not be
    // able to draw a bar past its own track.
    const pct = Math.max(0, Math.min(100, Math.round(value)))

    return <progress className={cn('progress-bar', className)} value={pct} max={100} aria-label={label} />
}
