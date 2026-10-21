'use client'

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'

/**
 * What is open inside the current section, for the top bar.
 *
 * The bar lives in the layout and the title lives in the page, and in the App Router a layout
 * cannot read anything from the page nested inside it — they render independently, and the layout
 * does not re-render on navigation within it.
 *
 * So the page announces its title and the bar reads it. A context rather than a URL parameter or a
 * second fetch: the page already has the course in hand, and `generateMetadata` has already paid
 * for that read.
 */
const TrailContext = createContext<{ trail?: string; setTrail: (value?: string) => void }>({
    setTrail: () => {}
})

export function TrailProvider({ children }: { children: ReactNode }) {
    const [trail, setTrail] = useState<string | undefined>(undefined)
    return <TrailContext.Provider value={{ trail, setTrail }}>{children}</TrailContext.Provider>
}

/** Read by the top bar. */
export function useTrail() {
    return useContext(TrailContext).trail
}

/**
 * Announces this page's title to the bar, and clears it on the way out.
 *
 * Renders nothing. The cleanup is what stops a course title lingering over the dashboard after a
 * back navigation — a stale breadcrumb is worse than none, because it is believable.
 */
export function SetTrail({ title }: { title: string }) {
    const { setTrail } = useContext(TrailContext)

    useEffect(() => {
        setTrail(title)
        return () => setTrail(undefined)
    }, [title, setTrail])

    return null
}
