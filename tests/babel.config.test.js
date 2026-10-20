// Test-only Babel config. The real build uses Next's SWC pipeline; this exists solely so Jest can
// parse TSX and the ESM that @pi-financial packages ship.
module.exports = {
    presets: [
        ['@babel/preset-env', { targets: { node: 'current' } }],
        ['@babel/preset-react', { runtime: 'automatic' }],
        '@babel/preset-typescript'
    ]
}
