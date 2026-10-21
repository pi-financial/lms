'use client'

import { SessionProvider } from 'next-auth/react'
import type { Session } from 'next-auth'

/**
 * Client wrapper for next-auth's SessionProvider.
 *
 * Needed for `useSession()` in Client Components. The session itself is read on the server in the
 * locale layout and passed down, so the first render already knows who is signed in.
 */
export function AuthSessionProvider({ children, session }: { children: React.ReactNode; session: Session | null }) {
    return <SessionProvider session={session}>{children}</SessionProvider>
}
