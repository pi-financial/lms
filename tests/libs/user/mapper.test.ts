/** @jest-environment node */
import type { DtoUserInfo } from '@pi-financial/user-srv-v2-client-axios'
import { toPiUser } from '@libs/user/mapper'

describe('toPiUser', () => {
    it('maps a fully populated DTO', () => {
        const dto: DtoUserInfo = {
            id: 'a1b2',
            citizenId: '1234567890123',
            custCodes: ['0900097', '0900098'],
            tradingAccounts: ['0900097-1'],
            firstnameTh: 'สมชาย',
            lastnameTh: 'ใจดี',
            firstnameEn: 'Somchai',
            lastnameEn: 'Jaidee',
            phoneNumber: '0812345678',
            email: 'somchai@example.com',
            dateOfBirth: '1990-01-15',
            wealthType: 'Wealth',
            riskLevel: '4',
            devices: [{ deviceId: 'd1' }, { deviceId: 'd2' }]
        }

        expect(toPiUser(dto)).toEqual({
            id: 'a1b2',
            nameTh: 'สมชาย ใจดี',
            nameEn: 'Somchai Jaidee',
            email: 'somchai@example.com',
            phoneNumber: '0812345678',
            custCodes: ['0900097', '0900098'],
            tradingAccounts: ['0900097-1'],
            wealthType: 'Wealth',
            riskLevel: '4',
            dateOfBirth: '1990-01-15',
            deviceCount: 2
        })
    })

    it('fills in defaults for an empty DTO, because every generated field is optional', () => {
        expect(toPiUser({})).toEqual({
            id: '',
            nameTh: '',
            nameEn: '',
            email: '',
            phoneNumber: '',
            custCodes: [],
            tradingAccounts: [],
            wealthType: '',
            riskLevel: '',
            dateOfBirth: '',
            deviceCount: 0
        })
    })

    it('joins only the name parts that are present, without a stray space', () => {
        expect(toPiUser({ firstnameTh: 'สมชาย' }).nameTh).toBe('สมชาย')
        expect(toPiUser({ lastnameEn: 'Jaidee' }).nameEn).toBe('Jaidee')
    })

    it('never surfaces the citizen ID in the domain type', () => {
        const user = toPiUser({ citizenId: '1234567890123' })
        expect(Object.values(user)).not.toContain('1234567890123')
    })
})
