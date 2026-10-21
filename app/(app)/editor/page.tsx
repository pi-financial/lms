import { requireEditor } from '@libs/auth/guard'
import { Placeholder } from '../placeholder'

export const metadata = { title: 'สร้างคอร์ส' }

export default async function EditorPage() {
    // The hidden tab is not the control — this is.
    await requireEditor()

    return (
        <Placeholder
            title="สร้างคอร์ส"
            summary="จัดการคอร์ส ตอน และข้อสอบ"
            todo={[
                'POST/PATCH /api/v1/courses — ตรวจ App role lms-editor ที่ service ไม่ใช่แค่ซ่อนแท็บ',
                'อัปโหลดไฟล์ผ่าน presigned URL อายุสั้น ไม่ใช่ public bucket',
                'หนึ่งตอนมีไฟล์ที่ต้องเรียนได้ตัวเดียว ไฟล์แนบกี่ไฟล์ก็ได้'
            ]}
        />
    )
}
