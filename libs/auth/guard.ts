import 'server-only'
import { notFound } from 'next/navigation'
import { auth } from './config'
import { isEditor } from './claims'

/**
 * Refuses a page to anyone without the editor App role.
 *
 * Hiding the tab is presentation; this is the control. A hidden link is still a URL, and typing
 * `/th/editor` reached the page in full before this existed.
 *
 * `notFound()` rather than a redirect or a 403: which screens exist is itself information, and a
 * learner has no reason to learn that an editor console is there to be asked for.
 */
export async function requireEditor() {
    const session = await auth()
    if (!isEditor(session?.roles)) notFound()
    return session!
}
