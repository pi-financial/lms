/** @jest-environment node */
import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const root = resolve(__dirname, '../..')

/**
 * `app/palette.generated.css` is committed so Docker builds need no codegen step — which means it
 * can silently go stale the moment someone bumps pi-common-js. This is the guard: the script's
 * `--check` mode regenerates from the installed package and fails if the committed file differs.
 */
describe('palette codegen', () => {
    it('the committed CSS matches the installed design tokens', () => {
        expect(() =>
            execFileSync('node', ['scripts/generate-palette-css.mjs', '--check'], { cwd: root, stdio: 'pipe' })
        ).not.toThrow()
    })

    it('exposes the brand ramp and the dark-mode override Tailwind needs', () => {
        const css = readFileSync(resolve(root, 'app/palette.generated.css'), 'utf8')

        expect(css).toContain('@theme {')
        expect(css).toMatch(/--color-pi-mint-500:\s*#[0-9a-fA-F]{6};/)
        expect(css).toContain("[data-theme='dark']")
        // Typography tokens carry their line-height as a Tailwind variant suffix.
        expect(css).toMatch(/--text-body-m--line-height:/)
    })
})
