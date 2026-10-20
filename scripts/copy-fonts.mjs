#!/usr/bin/env node
/**
 * Copies the Pi font files out of the package and into `public/fonts`.
 *
 * `@pi-financial/pi-common-js` ships the .ttf files inside `src/fonts`, but a browser can only
 * fetch what the app serves, and `node_modules` is not served. Runs on postinstall so a fresh clone
 * plus `yarn install` is enough; `public/fonts` is gitignored because it is derived, not authored.
 *
 * Silently does nothing when the package is absent — `yarn install` must not fail on a machine that
 * has not authenticated to GitHub Packages yet.
 */
import { copyFileSync, existsSync, mkdirSync, readdirSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const source = join(root, 'node_modules/@pi-financial/pi-common-js/src/fonts')
const target = join(root, 'public/fonts')

if (!existsSync(source)) {
    console.warn('[copy-fonts] @pi-financial/pi-common-js not installed — skipping font copy')
    process.exit(0)
}

mkdirSync(target, { recursive: true })

const fonts = readdirSync(source).filter(file => file.endsWith('.ttf'))
for (const font of fonts) {
    copyFileSync(join(source, font), join(target, font))
}

console.log(`[copy-fonts] copied ${fonts.length} font files to public/fonts`)
