/** @jest-environment node */
import { DEFAULT_THEME, resolveTheme } from '@libs/preferences/definitions'

/**
 * The value arrives from a cookie, which the client can set to anything, and is interpolated
 * straight into `<html data-theme>`. Falling back rather than passing the raw value through is what
 * stops that.
 */
describe('resolveTheme', () => {
    it('accepts the supported themes', () => {
        expect(resolveTheme('light')).toBe('light')
        expect(resolveTheme('dark')).toBe('dark')
    })

    it('falls back for anything else', () => {
        expect(resolveTheme('system')).toBe(DEFAULT_THEME)
        expect(resolveTheme(undefined)).toBe(DEFAULT_THEME)
    })

    it('falls back for a value that would break out of the attribute', () => {
        expect(resolveTheme('"><script>')).toBe(DEFAULT_THEME)
    })
})
