// next-logger replaces Next's own console output with pino so framework logs land in SigNoz in the
// same shape as application logs. Loaded by `await import('next-logger')` in instrumentation.ts.
const pino = require('pino')

const logger = defaultConfig =>
    pino({
        ...defaultConfig,
        timestamp: () => `,"time":"${new Date().toISOString()}"`
    })

module.exports = { logger }
