/** @jest-environment node */
import {
    DEFAULT_LOCALE,
    DEFAULT_THEME,
    localeFromPath,
    resolveLocale,
    resolveTheme,
    stripLocale,
    withLocale
} from '@libs/preferences/definitions'

/**
 * Both values arrive from a cookie, which the client can set to anything, and both are interpolated
 * straight into `<html lang>` / `<html data-theme>`. Falling back rather than passing the raw value
 * through is what stops that.
 */
describe('resolveLocale', () => {
    it('accepts the supported locales', () => {
        expect(resolveLocale('th')).toBe('th')
        expect(resolveLocale('en')).toBe('en')
    })

    it('falls back for an unsupported locale', () => {
        expect(resolveLocale('fr')).toBe(DEFAULT_LOCALE)
    })

    it('falls back when the cookie is absent', () => {
        expect(resolveLocale(undefined)).toBe(DEFAULT_LOCALE)
    })

    it('falls back for a value that would break out of the attribute', () => {
        expect(resolveLocale('"><script>')).toBe(DEFAULT_LOCALE)
    })
})

describe('resolveTheme', () => {
    it('accepts the supported themes', () => {
        expect(resolveTheme('light')).toBe('light')
        expect(resolveTheme('dark')).toBe('dark')
    })

    it('falls back for anything else', () => {
        expect(resolveTheme('system')).toBe(DEFAULT_THEME)
        expect(resolveTheme(undefined)).toBe(DEFAULT_THEME)
    })
})

describe('locale path helpers', () => {
    it('reads the prefix off a path', () => {
        expect(localeFromPath('/en/directus')).toBe('en')
        expect(localeFromPath('/th')).toBe('th')
    })

    it('reports no prefix for an unprefixed or unknown path', () => {
        expect(localeFromPath('/directus')).toBeUndefined()
        expect(localeFromPath('/fr/directus')).toBeUndefined()
        expect(localeFromPath('/')).toBeUndefined()
    })

    it('strips the prefix', () => {
        expect(stripLocale('/en/directus')).toBe('/directus')
        expect(stripLocale('/directus')).toBe('/directus')
    })

    /** A bare prefix must not strip down to '' — the proxy would then build `/en` + `` and loop. */
    it('strips a bare prefix to the root path', () => {
        expect(stripLocale('/th')).toBe('/')
    })

    it('adds the prefix', () => {
        expect(withLocale('en', '/directus')).toBe('/en/directus')
        expect(withLocale('th', '/')).toBe('/th')
    })

    /** Switching language re-prefixes an already-prefixed path; it must not stack them. */
    it('replaces an existing prefix rather than stacking', () => {
        expect(withLocale('en', '/th/directus')).toBe('/en/directus')
        expect(withLocale('en', '/th')).toBe('/en')
    })

    it('leaves a path that merely starts with locale-ish text alone', () => {
        expect(stripLocale('/theme/settings')).toBe('/theme/settings')
        expect(withLocale('en', '/theme/settings')).toBe('/en/theme/settings')
    })
})
