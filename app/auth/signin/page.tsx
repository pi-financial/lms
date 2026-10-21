import Image from 'next/image'
import { KeyRound } from 'lucide-react'
import { User } from 'lucide-react'
import { signIn } from '@libs/auth/config'
import { authConfigured } from '@libs/auth/env'
import { Button } from '@components/ui/button'

export const metadata = { title: 'เข้าสู่ระบบ' }

/**
 * Sign-in.
 *
 * One button, no password field: the credential never reaches this app. It goes to Microsoft
 * Entra, so the password and the MFA policy stay with Microsoft. A local password form would mean
 * operating a second credential store on the open internet and getting its lockout, rotation and
 * MFA right ourselves.
 *
 * `signIn` runs inside a Server Action, so the client id and the issuer never reach the browser.
 *
 * TODO(entra): the app registration does not exist yet. Until `.env.local` carries a real client
 * id, secret and tenant issuer, `authConfigured` is false and the button is replaced by a note
 * saying so — pressing it would otherwise send the browser to a tenant that does not recognise
 * this client and return it to an error page explaining none of this. See INFRA-REQUEST.md.
 */
export default function SignInPage() {
    return (
        <div className="relative flex min-h-dvh w-full items-center justify-center overflow-hidden bg-black-900 px-4">
            <div
                aria-hidden
                className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,var(--color-dark-green-800)_0%,var(--color-black-900)_75%)]"
            />

            <div className="relative w-full max-w-sm">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-8 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.6)] backdrop-blur-sm">
                    <div className="flex flex-col items-center text-center">
                        <div className="mb-5 flex size-16 items-center justify-center rounded-2xl border border-white/5 bg-white/5">
                            {/* `unoptimized`: the source is already a vector, so the optimizer buys
                                nothing and would need `dangerouslyAllowSVG`, which relaxes the rule
                                for every optimized SVG — and SVGs can carry scripts. */}
                            <Image
                                src="/images/logo.svg"
                                alt="Pi Financial"
                                width={40}
                                height={40}
                                priority
                                unoptimized
                                className="size-10"
                            />
                        </div>
                        <h1 className="text-sub-hl font-semibold tracking-tight text-white">Pi E-Learning</h1>
                        <p className="mt-1.5 text-body-s text-white/60">ระบบอบรมพนักงาน</p>
                    </div>

                    <div className="mt-7">
                        {authConfigured ? (
                            <form
                                action={async () => {
                                    'use server'
                                    await signIn('microsoft-entra-id', { redirectTo: '/' })
                                }}
                            >
                                <Button type="submit" className="w-full">
                                    <KeyRound />
                                    เข้าสู่ระบบด้วยบัญชีพนักงาน
                                </Button>
                            </form>
                        ) : (
                            <div className="flex flex-col gap-3">
                                <Button type="button" className="w-full" disabled>
                                    <KeyRound />
                                    เข้าสู่ระบบด้วยบัญชีพนักงาน
                                </Button>
                                <p className="rounded-lg border border-orange-400/30 bg-orange-400/10 px-3 py-2 text-center text-label-xs-regular leading-relaxed text-orange-200">
                                    ยังเชื่อมต่อ Microsoft ไม่ได้ — รอ app registration ของ lms
                                    <br />
                                    <span className="text-white/40">ดูรายละเอียดที่ INFRA-REQUEST.md</span>
                                </p>

                                {/* Dev only. The provider behind these buttons is absent from any
                                    build where Entra is configured, so there is nothing here to
                                    disable before deploying — see `devProviders` in auth/config. */}
                                <div className="relative my-1">
                                    <div className="absolute inset-0 flex items-center">
                                        <span className="w-full border-t border-white/10" />
                                    </div>
                                    <div className="relative flex justify-center">
                                        <span className="bg-black-900 px-2 text-label-xs-regular uppercase text-white/40">
                                            Dev only
                                        </span>
                                    </div>
                                </div>

                                {(
                                    [
                                        { role: 'learner', label: 'เข้าใช้งานเป็น Learner' },
                                        { role: 'editor', label: 'เข้าใช้งานเป็น Editor' }
                                    ] as const
                                ).map(({ role, label }) => (
                                    <form
                                        key={role}
                                        action={async () => {
                                            'use server'
                                            await signIn('dev-bypass', { role, redirectTo: '/' })
                                        }}
                                    >
                                        <Button
                                            type="submit"
                                            variant="outline"
                                            className="w-full border-white/20 bg-white/5 text-white hover:bg-white/10"
                                        >
                                            <User />
                                            {label}
                                        </Button>
                                    </form>
                                ))}
                            </div>
                        )}
                    </div>

                    <p className="mt-6 text-center text-label-xs-regular leading-relaxed text-white/40">
                        ยืนยันตัวตนผ่าน Microsoft · ใช้บัญชีพนักงาน Pi Financial เท่านั้น
                    </p>
                </div>

                <p className="mt-5 text-center text-label-xs-regular text-white/40">
                    © {new Date().getFullYear()} Pi Financial · Pi E-Learning
                </p>
            </div>
        </div>
    )
}
