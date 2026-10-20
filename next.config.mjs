import { buildSecurityHeaderRules } from './libs/security/securityHeaders.mjs'

/** @type {import('next').NextConfig} */
const nextConfig = {
    // Produces .next/standalone/server.js — the only thing the runtime image needs.
    output: 'standalone',

    poweredByHeader: false,

    // These carry nested dynamic requires (require-in-the-middle) that a bundler cannot resolve
    // statically. Leaving them external is what makes OTel auto-instrumentation work at all.
    serverExternalPackages: [
        '@opentelemetry/instrumentation',
        '@opentelemetry/sdk-node',
        'require-in-the-middle',
        'import-in-the-middle'
    ],

    logging: {
        serverFunctions: true,
        browserToTerminal: true
    },

    async headers() {
        return buildSecurityHeaderRules()
    }
}

export default nextConfig
