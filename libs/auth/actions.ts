'use server'

import { signOut } from '@libs/auth/config'

export async function signOutAction() {
    await signOut({ redirectTo: '/auth/signin' })
}
