/**
 * Domain types owned by this app.
 *
 * Generated DTOs from `@pi-financial/user-srv-v2-client-axios` stop at the service boundary
 * (`libs/user/mapper.ts`). Components never import them: the generated types mark every field
 * optional, they change whenever the service republishes its client, and they carry a pinned copy
 * of axios along with them. Mapping once, here, keeps all of that in one file.
 */
export type PiUser = {
    id: string
    nameTh: string
    nameEn: string
    email: string
    phoneNumber: string
    /** Customer codes ("accounts") this user holds. */
    custCodes: string[]
    tradingAccounts: string[]
    wealthType: string
    riskLevel: string
    /** ISO-ish date string as returned by the service, e.g. "2024-12-27". */
    dateOfBirth: string
    deviceCount: number
}

/**
 * Filters accepted by `GET /internal/v1/users`. All optional — omitting every one lists everybody,
 * so callers should always pass at least one.
 */
export type UserFilters = {
    accountId?: string
    citizenId?: string
    email?: string
    firstName?: string
    lastName?: string
    phoneNumber?: string
    /** Comma-separated user UUIDs. The service rejects the whole request if any one is malformed. */
    ids?: string
}
