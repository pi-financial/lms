import NextAuth from 'next-auth'
import MicrosoftEntraID from 'next-auth/providers/microsoft-entra-id'
import Credentials from 'next-auth/providers/credentials'
import { appCookies, usesSecureCookies } from './cookies'
import { collectRoles, resolveEmail, ROLE_EDITOR, ROLE_LEARNER, type EntraClaims } from './claims'
import { authConfigured, authEnv } from './env'

/**
 * Authentication — Microsoft Entra ID, spoken to directly.
 *
 * The credential and the MFA policy live with Microsoft; this app receives an OIDC ID token and
 * reads two things from it: who signed in, and which App roles they hold. Same arrangement as
 * console-web, which is what makes a role administered in the Entra portal take effect here
 * without a deployment.
 *
 * The issuer must name the tenant. Left unset the provider falls back to `/common/`, which admits
 * any Microsoft account including a personal one — `env.ts` rejects that rather than trusting the
 * value to be filled in correctly.
 */

/**
 * A sign-in that bypasses Entra, for development only.
 *
 * Present when two things are true at once: the build is not production, and Entra is not
 * configured. It exists so the screens behind the login can be built before the app registration
 * does — without it, every page in the app is unreachable and the work stops.
 *
 * It is not a backdoor that can reach a deployment: `authConfigured` is true wherever the real
 * provider works, which removes this one, and `NODE_ENV` gates it besides.
 *
 * TODO(entra): delete this provider once the app registration exists.
 */
const devProviders =
    process.env.NODE_ENV !== 'production' && !authConfigured
        ? [
              Credentials({
                  id: 'dev-bypass',
                  name: 'Dev bypass',
                  credentials: { role: { label: 'Role', type: 'text' } },
                  authorize: credentials => {
                      const editor = credentials?.role === 'editor'
                      return {
                          id: editor ? 'dev-editor' : 'dev-learner',
                          email: editor ? 'dev.editor@pi.co.th' : 'dev.learner@pi.co.th',
                          name: editor ? 'Dev Editor' : 'Dev Learner',
                          roles: editor ? [ROLE_EDITOR, ROLE_LEARNER] : [ROLE_LEARNER]
                      }
                  }
              })
          ]
        : []

export const { handlers, auth, signIn, signOut } = NextAuth({
    secret: authEnv.AUTH_SECRET,

    providers: [
        MicrosoftEntraID({
            clientId: authEnv.AUTH_MICROSOFT_ENTRA_ID_ID,
            clientSecret: authEnv.AUTH_MICROSOFT_ENTRA_ID_SECRET,
            issuer: authEnv.AUTH_MICROSOFT_ENTRA_ID_ISSUER
        }),
        ...devProviders
    ],

    // Named for this app. Cookies ignore the port, so on localhost every Next app shares one jar
    // and the default `authjs.*` names let one app's session decrypt in another. See `cookies.ts`.
    cookies: appCookies('lms', usesSecureCookies(authEnv.AUTH_URL)),

    // 8 hours. This app is reached from personal devices over the public internet, where a lost
    // phone is a plausible way for a session to outlive its owner's control. No `offline_access`
    // scope is requested, so there is no refresh token: the session runs on its own clock, and a
    // role removed in Entra stops working at the next sign-in rather than immediately.
    session: { strategy: 'jwt', maxAge: 8 * 60 * 60 },

    pages: {
        signIn: '/auth/signin',
        error: '/auth/error'
    },

    callbacks: {
        async jwt({ token, account, profile, user }) {
            // Only the sign-in call carries an account; later calls just re-read the token.
            if (!account) return token

            // The dev bypass has no Entra profile — its roles come straight off the user object.
            if (account.provider === 'dev-bypass') {
                return {
                    ...token,
                    email: user?.email ?? undefined,
                    name: user?.name ?? undefined,
                    roles: (user as { roles?: string[] })?.roles ?? [ROLE_LEARNER],
                    rolesGroup: []
                }
            }

            // Entra hands `profile` the validated ID-token claims, which is where an App role
            // assigned to this app arrives. The access token is Graph's and never carries them.
            const claims = (profile ?? {}) as EntraClaims

            return {
                ...token,
                email: resolveEmail(claims, token.email) ?? undefined,
                roles: collectRoles(claims),
                rolesGroup: claims.groups ?? []
            }
        },

        async session({ session, token }) {
            session.roles = (token.roles as string[]) ?? []
            session.rolesGroup = (token.rolesGroup as string[]) ?? []
            return session
        }
    }
})
