/** @jest-environment node */
const mockUpdateTag = jest.fn()
// `unstable_cache` is stubbed too: importing DIRECTUS_CACHE_TAG pulls in the whole content module,
// which builds a cached fetcher at import time.
jest.mock('next/cache', () => ({
    updateTag: (...args: unknown[]) => mockUpdateTag(...args),
    unstable_cache: (fn: unknown) => fn
}))
jest.mock('@libs/logger', () => ({
    logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() }
}))

const mockGetWebContents = jest.fn()
jest.mock('@libs/directus/content', () => ({
    ...jest.requireActual('@libs/directus/content'),
    getWebContents: (...args: unknown[]) => mockGetWebContents(...args)
}))

import { getContentAction, revalidateContentAction } from '@app/[locale]/directus/action'
import { DIRECTUS_CACHE_TAG } from '@libs/directus/content'

describe('getContentAction', () => {
    beforeEach(() => mockGetWebContents.mockResolvedValue({ items: [], degraded: false }))

    /**
     * The point of putting the locale in the path: `/en/directus` and `/th/directus` fetch
     * different CMS content, so the URL alone determines what the page says.
     */
    it('reads content in the locale it is given', async () => {
        await getContentAction('en', { namespaces: '2' })

        expect(mockGetWebContents).toHaveBeenCalledWith('en', [2])
    })

    /** The action is a public POST endpoint, so the locale is re-validated, not trusted. */
    it('falls back to the default locale for an unknown one', async () => {
        await getContentAction('fr', {})

        expect(mockGetWebContents).toHaveBeenCalledWith('th', [1])
    })

    it('ignores a language in the input — the path owns it', async () => {
        await getContentAction('th', { language: 'en' })

        expect(mockGetWebContents).toHaveBeenCalledWith('th', [1])
    })
})

describe('revalidateContentAction', () => {
    it('expires exactly the content tag', async () => {
        await expect(revalidateContentAction()).resolves.toEqual({ ok: true })
        expect(mockUpdateTag).toHaveBeenCalledWith(DIRECTUS_CACHE_TAG)
    })

    it('reports a failure rather than throwing out of the action', async () => {
        mockUpdateTag.mockImplementation(() => {
            throw new Error('not in a request scope')
        })

        await expect(revalidateContentAction()).resolves.toEqual({
            ok: false,
            error: 'not in a request scope'
        })
    })
})
