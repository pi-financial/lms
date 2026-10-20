import type { DtoUserInfo } from '@pi-financial/user-srv-v2-client-axios'
import type { PiUser } from './definitions'

/**
 * `DtoUserInfo` has every field optional, so each one needs a fallback. Empty string rather than
 * `undefined` keeps the render side free of `?? ''` noise; `id` is the one field worth surfacing as
 * empty-and-obviously-wrong instead of silently dropping the row.
 *
 * `citizenId` is intentionally not mapped: it comes back on the internal endpoint but no screen in
 * a boilerplate has a reason to display a national ID, and the easiest way to avoid leaking it into
 * a client component's props is to never put it in the domain type.
 */
export function toPiUser(dto: DtoUserInfo): PiUser {
    const nameTh = [dto.firstnameTh, dto.lastnameTh].filter(Boolean).join(' ')
    const nameEn = [dto.firstnameEn, dto.lastnameEn].filter(Boolean).join(' ')

    return {
        id: dto.id ?? '',
        nameTh,
        nameEn,
        email: dto.email ?? '',
        phoneNumber: dto.phoneNumber ?? '',
        custCodes: dto.custCodes ?? [],
        tradingAccounts: dto.tradingAccounts ?? [],
        wealthType: dto.wealthType ?? '',
        riskLevel: dto.riskLevel ?? '',
        dateOfBirth: dto.dateOfBirth ?? '',
        deviceCount: dto.devices?.length ?? 0
    }
}
