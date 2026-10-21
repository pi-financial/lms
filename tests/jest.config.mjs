import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))

/**
 * Test config lives under tests/ rather than at the root so the app tree stays free of tooling,
 * but `rootDir` points back up: tests import application code through the same `@libs/*` aliases
 * the app uses.
 *
 * Plain `.mjs` and not `.ts` — Jest parses a TypeScript config through ts-node, which drives the
 * TypeScript compiler API that TS 7 no longer exposes in the same shape.
 *
 * @type {import('jest').Config}
 */
export default {
    rootDir: '..',
    // `.next/standalone` contains a copy of package.json, which jest-haste-map reports as a naming
    // collision on any run that follows a build.
    modulePathIgnorePatterns: ['<rootDir>/.next/'],
    testEnvironment: 'jsdom',
    // .mjs is here for libs/security/securityHeaders.mjs — plain ESM that Jest cannot parse untransformed.
    moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'mjs', 'json'],

    setupFilesAfterEnv: ['<rootDir>/tests/jest.setup.ts'],
    testMatch: ['<rootDir>/tests/**/*.test.ts', '<rootDir>/tests/**/*.test.tsx'],
    clearMocks: true,
    coverageProvider: 'v8',
    collectCoverageFrom: ['libs/**/*.{ts,tsx}', 'app/**/*.{ts,tsx}', 'components/**/*.{ts,tsx}', '!**/*.d.ts'],
    moduleNameMapper: {
        '^@libs/(.*)$': '<rootDir>/libs/$1',
        '^@app/(.*)$': '<rootDir>/app/$1',
        '^@components/(.*)$': '<rootDir>/components/$1',
        // `server-only` throws by design when imported outside a Server Component. Under Jest there
        // is no such distinction, so it is stubbed out rather than worked around at each call site.
        '^server-only$': '<rootDir>/tests/__mocks__/emptyMock.js',
        '\\.(css|scss)$': '<rootDir>/tests/__mocks__/styleMock.js'
    },
    transform: {
        // Absolute path, not `<rootDir>/…`: Jest expands that token in its own option values but
        // passes transformer options through untouched, and babel reads the string literally.
        '^.+\\.(t|j)sx?$|^.+\\.mjs$': ['babel-jest', { configFile: resolve(here, 'babel.config.test.js') }]
    },
    // These ship untranspiled ESM, which Jest cannot parse without running them through babel.
    transformIgnorePatterns: ['/node_modules/(?!(@pi-financial/pi-common-js)/)']
}
