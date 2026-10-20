/** @jest-environment node */
import { ContentNamespace } from '@libs/directus/definitions'
import { parseNamespaces } from '@app/[locale]/directus/params'

describe('parseNamespaces', () => {
    it('defaults to the Common namespace', () => {
        expect(parseNamespaces({})).toEqual([ContentNamespace.Common])
    })

    it('parses a comma-separated list', () => {
        expect(parseNamespaces({ namespaces: '1,2' })).toEqual([ContentNamespace.Common, ContentNamespace.Home])
    })

    /**
     * Namespaces go straight into `filter[namespace][_in]` against a token that can read the whole
     * collection, so an unchecked id would let a caller page through namespaces this app was never
     * meant to expose.
     */
    it('drops ids that are not in the enum', () => {
        expect(parseNamespaces({ namespaces: '1,999' })).toEqual([ContentNamespace.Common])
    })

    it('falls back to the default when every id is rejected', () => {
        expect(parseNamespaces({ namespaces: '999,abc' })).toEqual([ContentNamespace.Common])
    })

    /** Language is owned by the nav switcher, not the URL — see the note in params.ts. */
    it('ignores a language param entirely', () => {
        expect(parseNamespaces({ language: 'en', namespaces: '2' })).toEqual([ContentNamespace.Home])
    })
})
