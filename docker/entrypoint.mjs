/**
 * Replaces the __NEXT_PUBLIC_*__ placeholders baked into the built bundle with the container's
 * real values, then starts the server. This is what lets one image run in every environment.
 *
 * Node rather than a shell script because the runtime image is distroless: no sh, sed or find.
 */
import { readdir, readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'

const SCAN_ROOT = '/app/.next'
const SCAN_EXTENSIONS = ['.js', '.html', '.rsc']
const TOKEN_PATTERN = /__NEXT_PUBLIC_[A-Za-z0-9_]*__/g

function collectReplacements() {
    return new Map(
        Object.entries(process.env)
            .filter(([name, value]) => name.startsWith('NEXT_PUBLIC_') && value !== undefined)
            .map(([name, value]) => [`__${name}__`, value])
    )
}

async function* walk(dir) {
    let entries
    try {
        entries = await readdir(dir, { withFileTypes: true })
    } catch {
        return
    }
    for (const entry of entries) {
        const path = join(dir, entry.name)
        if (entry.isDirectory()) yield* walk(path)
        else if (SCAN_EXTENSIONS.some(ext => entry.name.endsWith(ext))) yield path
    }
}

async function inject() {
    const replacements = collectReplacements()
    const leftovers = new Set()
    let rewritten = 0

    for await (const path of walk(SCAN_ROOT)) {
        const original = await readFile(path, 'utf8')
        if (!original.includes('__NEXT_PUBLIC_')) continue

        let updated = original
        for (const [token, value] of replacements) updated = updated.split(token).join(value)

        for (const match of updated.match(TOKEN_PATTERN) ?? []) leftovers.add(match)

        if (updated !== original) {
            await writeFile(path, updated)
            rewritten++
        }
    }

    if (replacements.size === 0) console.warn('[entrypoint] no NEXT_PUBLIC_* in the environment')
    else console.log(`[entrypoint] injected ${replacements.size} value(s) into ${rewritten} file(s)`)

    if (leftovers.size > 0) {
        console.warn(
            `[entrypoint] WARNING: no value supplied for ${[...leftovers].join(', ')} — ` +
                'the placeholder will be visible to users'
        )
    }
}

await inject()
await import('./server.js')
