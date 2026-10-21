import type { Certificate } from '@libs/api/definitions'
import { cn } from '@libs/ui/cn'

/**
 * The certificate drawn as the document it is.
 *
 * Deliberately the only thing on the page with a border on all four sides and a ground of its own:
 * a learner should recognise it as the artefact they will download, not as another panel of the
 * app. Which is also why the name is set large and centred — on the real document it is the line
 * that matters, and a preview that buries it would not read as the same object.
 *
 * An expired certificate keeps its face and takes a stamp across it. The record still stands; only
 * its validity lapsed, and someone who arrived here did so to find out why it stopped counting.
 */
export function CertificateFace({ certificate }: { certificate: Certificate }) {
    const expired = certificate.expired

    return (
        <div
            className={cn(
                'relative flex min-h-50 flex-col gap-3.5 rounded-xl border-[1.5px] p-5',
                expired ? 'border-locked' : 'border-earned'
            )}
            style={{
                background: expired
                    ? 'linear-gradient(160deg, var(--color-locked-soft), var(--color-panel) 70%)'
                    : 'linear-gradient(160deg, var(--color-earned-soft), var(--color-panel) 70%)'
            }}
        >
            {expired ? (
                <span
                    // Not `aria-hidden`: the stamp is the only thing saying the document is void,
                    // and a reader who cannot see it still needs that fact.
                    //
                    // Placed low and right rather than dead centre, where it landed across the
                    // holder's name — a stamp that obscures whose certificate this is defeats the
                    // reason someone opened it. Opaque, not translucent, so the two never overlap
                    // into an unreadable tangle at any text length.
                    className="pointer-events-none absolute top-[62%] left-1/2 -translate-x-1/2 -rotate-12 rounded-lg border-[2.5px] border-locked bg-panel px-4 py-1 text-sub-hl font-semibold tracking-wider whitespace-nowrap text-locked"
                >
                    หมดอายุแล้ว
                </span>
            ) : null}

            <div
                className={cn(
                    'flex items-center justify-between text-label-xs-regular',
                    expired ? 'text-locked' : 'text-earned-ink'
                )}
            >
                <span>
                    <b className="font-semibold">Pi</b> E-Learning
                </span>
                <span className="font-rubik tnum opacity-75">{certificate.id}</span>
            </div>

            <div className="flex flex-1 flex-col justify-center gap-1.5 text-center">
                <span className="font-rubik text-label-xs-regular tracking-[0.14em] text-ink-3 uppercase">
                    ใบรับรองการอบรม
                </span>
                <strong className={cn('text-h3 font-medium', expired ? 'text-locked' : 'text-earned-ink')}>
                    {certificate.holderName}
                </strong>
                <span className="text-label-m-regular text-ink-2">{certificate.courseTitle}</span>
            </div>

            <div className="flex justify-between border-t border-line-soft pt-2.5 text-label-xs-regular text-ink-3">
                <span>ออกให้ {certificate.issuedOn}</span>
                <span className={expired ? 'font-medium text-locked' : undefined}>หมดอายุ {certificate.expiresOn}</span>
            </div>
        </div>
    )
}
