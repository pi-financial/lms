/**
 * Wrapper for the auth screens.
 *
 * These pages sit outside the `(app)` group because they need no rail, no top bar and no session —
 * everything `app/(app)/layout.tsx` renders assumes someone is signed in. `<html>` and `<body>`
 * come from the root layout, which is the only place they can be.
 *
 * `data-theme="light"` is set here deliberately, overriding the cookie for this subtree. These
 * screens are single-theme: the card is drawn directly in `black-900` on a dark-green gradient,
 * and in the dark palette `black-900` resolves to near-white — a visitor who had switched the app
 * to dark would otherwise reach a sign-in page of white text on white.
 */
export default function AuthLayout({ children }: { children: React.ReactNode }) {
    return <div data-theme="light">{children}</div>
}
