/**
 * Session and token shape.
 *
 * Augments `@auth/core/types`, not `"next-auth"`. In Auth.js v5 the `Session` interface is declared
 * in `@auth/core/types` and only re-exported by `next-auth`; a `declare module "next-auth"` block
 * compiles without complaint and adds the fields to nothing, so `session.roles` stays an error at
 * every call site. `JWT` lives in `@auth/core/jwt` for the same reason.
 *
 * Kept beside the code that depends on it rather than in a top-level `types/`. The two tsconfigs
 * cover different file sets — `tests/tsconfig.json` includes `app/` and `libs/` and nothing else —
 * so an augmentation outside both directories is read by one program and invisible to the other,
 * and the same source then typechecks under `tsc` and fails under the test config.
 */
import type { DefaultSession } from '@auth/core/types'

declare module '@auth/core/types' {
    interface Session extends DefaultSession {
        /** Entra App roles from the ID token — `lms-editor`, `lms-learner`. */
        roles: string[]
        /** Entra group claim, when the tenant is configured to send one. */
        rolesGroup: string[]
    }
}

declare module '@auth/core/jwt' {
    interface JWT {
        roles?: string[]
        rolesGroup?: string[]
    }
}
