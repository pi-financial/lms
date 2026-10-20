#!/usr/bin/env node
/**
 * Turns the Pi design tokens into Tailwind v4 theme variables.
 *
 * `@pi-financial/pi-common-js` ships tokens as `as const` JS objects, built for MUI's
 * `createTheme`. Tailwind v4 is CSS-first: its `@theme` block *is* the config, and it cannot import
 * JavaScript. This script bridges the two, so `piMint500` in the package becomes
 * `--color-pi-mint-500` in CSS and `bg-pi-mint-500` in markup — one source of truth, no hand-copied
 * hex values drifting away from the design system.
 *
 * Output is committed (`app/palette.generated.css`) so Docker builds need no extra step, and a test
 * re-runs this to assert the committed file is current. Upgrade pi-common-js, run `yarn gen:tokens`,
 * and the diff tells you exactly which colours the designers changed.
 *
 * Usage: yarn gen:tokens          write the file
 *        yarn gen:tokens --check  fail if the committed file is stale
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { darkPalette, lightPalette } from '@pi-financial/pi-common-js/palette'
import { buildFontFaceCSS, typographyTokens } from '@pi-financial/pi-common-js/typography'

const OUTPUT = resolve(dirname(fileURLToPath(import.meta.url)), '../app/palette.generated.css')

/**
 * Light and dark are not the same names with a prefix — the dark palette renames families, and two
 * of them collide (light `green` maps to dark `darkGreen`, while light `darkGreen` maps to dark
 * `darkDarkGreen`). Blindly stripping a `dark` prefix would silently swap those two ramps, so the
 * mapping is spelled out.
 *
 * The shade scale is also inverted in dark mode by design: 50 is the darkest tone there and the
 * lightest here. That is intentional and is why `--color-x-50` means "subtlest background" in both
 * themes rather than "lightest colour".
 */
const FAMILY_MAP = {
    piMint: 'darkPiMint',
    green: 'darkGreen',
    darkGreen: 'darkDarkGreen',
    darkBlue: 'darkBlue',
    darkPurple: 'darkPurple',
    red: 'darkRed',
    orange: 'darkOrange',
    yellow: 'darkYellow',
    grey: 'darkGreyNeutral',
    black: 'darkBlackWhite'
}

/**
 * Shades are read off the light palette rather than hard-coded: the ramps are mostly 50–900, but
 * `grey` starts at 100. Deriving them means a package that adds or drops a step regenerates cleanly
 * instead of throwing.
 *
 * The regex anchors the digits to the end of the exact family name, so `green500` and
 * `darkGreen500` stay in separate ramps instead of one matching the other by prefix.
 */
function shadesOf(palette, family) {
    const pattern = new RegExp(`^${family}(\\d+)$`)
    return Object.keys(palette)
        .map(key => key.match(pattern)?.[1])
        .filter(Boolean)
        .map(Number)
        .toSorted((a, b) => a - b)
}

const kebab = name =>
    name
        .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
        .replace(/([A-Z]+)([A-Z][a-z])/g, '$1-$2')
        .toLowerCase()

function requireToken(palette, key, source) {
    const value = palette[key]
    if (value === undefined) throw new Error(`${source} is missing token "${key}" — did pi-common-js rename it?`)
    return value
}

function buildColorVars() {
    const light = []
    const dark = []

    for (const [lightFamily, darkFamily] of Object.entries(FAMILY_MAP)) {
        const cssFamily = kebab(lightFamily)
        const shades = shadesOf(lightPalette, lightFamily)
        if (shades.length === 0) throw new Error(`lightPalette has no "${lightFamily}" ramp`)

        for (const shade of shades) {
            const variable = `--color-${cssFamily}-${shade}`
            light.push(`    ${variable}: ${requireToken(lightPalette, `${lightFamily}${shade}`, 'lightPalette')};`)
            dark.push(`        ${variable}: ${requireToken(darkPalette, `${darkFamily}${shade}`, 'darkPalette')};`)
        }
        light.push('')
        dark.push('')
    }

    // Neutrals with no dark counterpart — the same value in both themes.
    light.push(`    --color-white: ${requireToken(lightPalette, 'white', 'lightPalette')};`)
    light.push(`    --color-overlay-70: ${requireToken(lightPalette, 'overlay70', 'lightPalette')};`)

    return { light: light.join('\n').trimEnd(), dark: dark.join('\n').trimEnd() }
}

function buildTypographyVars() {
    const lines = []

    for (const [variant, token] of Object.entries(typographyTokens)) {
        const name = kebab(variant)
        lines.push(`    --text-${name}: ${token.fontSize};`)
        lines.push(`    --text-${name}--line-height: ${token.lineHeight};`)
        lines.push(`    --text-${name}--letter-spacing: ${token.letterSpacing};`)
        lines.push(`    --text-${name}--font-weight: ${token.fontWeight};`)
    }

    return lines.join('\n')
}

export function buildPaletteCss() {
    const colors = buildColorVars()

    return `/*
 * GENERATED FILE — do not edit by hand.
 * Run \`yarn gen:tokens\` to regenerate from @pi-financial/pi-common-js.
 *
 * Exposes the Pi design tokens as Tailwind v4 theme variables, so \`bg-pi-mint-500\`,
 * \`text-body-m\` and \`font-graphik-th\` are available as utilities.
 * Dark mode is opt-in per subtree via \`data-theme="dark"\`.
 */
${buildFontFaceCSS('/fonts')}

@theme {
    /* ── Fonts ─────────────────────────────────────────────────────────────── */
    --font-graphik-th: 'Graphik TH', sans-serif;
    --font-rubik: 'Rubik', sans-serif;

    /* ── Typography ────────────────────────────────────────────────────────── */
${buildTypographyVars()}

    /* ── Colours (light) ───────────────────────────────────────────────────── */
${colors.light}
}

@layer base {
    [data-theme='dark'] {
${colors.dark}
    }
}
`
}

const css = buildPaletteCss()

// `--check` is what CI and the unit test use: it fails when the committed file no longer matches
// the tokens in the installed package, which is the moment a pi-common-js upgrade changed a colour.
if (process.argv.includes('--check')) {
    const current = existsSync(OUTPUT) ? readFileSync(OUTPUT, 'utf8') : ''
    if (current !== css) {
        console.error('app/palette.generated.css is out of date — run `yarn gen:tokens` and commit the result.')
        process.exit(1)
    }
    console.log('app/palette.generated.css is up to date.')
} else {
    writeFileSync(OUTPUT, css, 'utf8')
    console.log(`Wrote ${OUTPUT}`)
}
