/**
 * Passthrough root layout.
 *
 * `<html>` and `<body>` live in `app/[locale]/layout.tsx` instead, because `lang` has to carry the
 * locale and only a layout inside the `[locale]` segment can read it. Next requires a root layout
 * to exist; it does not require this one to render the document shell.
 */
export default function RootLayout({ children }: { children: React.ReactNode }) {
    return children
}
