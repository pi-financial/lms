/** @jest-environment node */
const mockRequest = jest.fn()
jest.mock('@libs/directus/client', () => ({
    ...jest.requireActual('@libs/directus/client'),
    getDirectusClient: () => ({ request: mockRequest })
}))
jest.mock('@directus/sdk', () => ({
    readItems: jest.fn((collection: string, query: unknown) => ({ collection, query }))
}))
jest.mock('@libs/logger', () => ({
    logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() }
}))

// `unstable_cache` is pass-through here: what matters is *where* the error is caught relative to
// it, and a real cache would make that untestable.
jest.mock('next/cache', () => ({ unstable_cache: (fn: unknown) => fn }))

import { ContentNamespace } from '@libs/directus/definitions'
import { getTranslations, getWebContents } from '@libs/directus/content'

describe('getWebContents', () => {
    it('builds the shared web_contents query', async () => {
        mockRequest.mockResolvedValue([])

        await getWebContents('th', [ContentNamespace.Common])

        const { collection, query } = mockRequest.mock.calls[0][0]
        expect(collection).toBe('web_contents')
        expect(query.fields).toEqual(['id', 'namespace', { translations: ['value'] }])
        expect(query.filter).toEqual({ namespace: { _in: [ContentNamespace.Common] } })
        // `deep` filters the nested translations; a plain filter would drop whole rows instead.
        expect(query.deep).toEqual({
            translations: {
                _filter: {
                    // `_starts_with`, because the stored codes are locales like `th-TH`.
                    languages_code: { code: { _starts_with: 'th' } },
                    value: { _nnull: true }
                }
            }
        })
        // Directus silently caps responses at 100 rows without this.
        expect(query.limit).toBe(-1)
    })

    it('passes the requested language through to the deep filter', async () => {
        mockRequest.mockResolvedValue([])

        await getWebContents('en', [ContentNamespace.Home])

        const { query } = mockRequest.mock.calls[0][0]
        expect(query.deep.translations._filter.languages_code.code._starts_with).toBe('en')
    })

    it('normalises a null translations array to an empty one', async () => {
        mockRequest.mockResolvedValue([{ id: 1, namespace: 1, translations: null }])

        await expect(getWebContents('th', [ContentNamespace.Common])).resolves.toEqual({
            items: [{ id: 1, namespace: 1, translations: [] }],
            degraded: false
        })
    })

    /**
     * The important half of the contract: a CMS outage degrades the page instead of taking it down,
     * and — because the catch sits outside `unstable_cache` — the empty fallback is never written
     * to the cache, so the next request retries instead of serving nothing for the full hour.
     */
    it('degrades to an empty list when Directus is unreachable', async () => {
        mockRequest.mockRejectedValue(new Error('ENOTFOUND directus.internal'))

        await expect(getWebContents('th', [ContentNamespace.Common])).resolves.toEqual({
            items: [],
            degraded: true
        })
    })
})

describe('getTranslations', () => {
    it('flattens rows into an id → text map', async () => {
        mockRequest.mockResolvedValue([
            { id: 1115, namespace: 1, translations: [{ value: 'สวัสดี' }] },
            { id: 1116, namespace: 1, translations: [{ value: 'ยินดีต้อนรับ' }] }
        ])

        await expect(getTranslations('th', [ContentNamespace.Common])).resolves.toEqual({
            1115: 'สวัสดี',
            1116: 'ยินดีต้อนรับ'
        })
    })

    it('maps an untranslated row to an empty string rather than dropping it', async () => {
        mockRequest.mockResolvedValue([{ id: 1115, namespace: 1, translations: [] }])

        // A lookup must never return undefined and render the literal word "undefined".
        await expect(getTranslations('th', [ContentNamespace.Common])).resolves.toEqual({ 1115: '' })
    })
})
