import Link from 'next/link'
import { Button } from '@components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@components/ui/card'

export const metadata = { title: 'เข้าสู่ระบบไม่สำเร็จ' }

/**
 * Auth.js redirects here with `?error=` when sign-in fails.
 *
 * The messages name what the person can do about it and stop there. A failure of the second kind —
 * a configuration error — is a deployment problem, and spelling out which setting is wrong on a
 * public page tells an attacker about the tenant as readily as it tells the user.
 */
const MESSAGES: Record<string, string> = {
    Configuration: 'ระบบตั้งค่าไม่ถูกต้อง กรุณาติดต่อผู้ดูแลระบบ',
    AccessDenied: 'บัญชีนี้ไม่มีสิทธิ์เข้าใช้งานระบบอบรม',
    Verification: 'ลิงก์ยืนยันไม่ถูกต้องหรือหมดอายุแล้ว',
    Default: 'เกิดข้อผิดพลาดที่ไม่คาดคิด กรุณาลองใหม่อีกครั้ง'
}

export default async function AuthErrorPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
    const { error } = await searchParams
    const message = MESSAGES[error ?? 'Default'] ?? MESSAGES.Default

    return (
        <div className="flex min-h-dvh items-center justify-center bg-grey-100 px-4">
            <Card className="w-full max-w-sm">
                <CardHeader className="text-center">
                    <CardTitle className="text-red-600">เข้าสู่ระบบไม่สำเร็จ</CardTitle>
                    <CardDescription>{message}</CardDescription>
                </CardHeader>
                <CardContent>
                    <Button asChild variant="outline" className="w-full">
                        <Link href="/auth/signin">กลับไปหน้าเข้าสู่ระบบ</Link>
                    </Button>
                </CardContent>
            </Card>
        </div>
    )
}
