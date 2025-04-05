/**
 * @param {import('webpack').WebpackOptionsNormalized} argv - Webpack CLI arguments
 * @returns {import('webpack').WebpackOptionsNormalized & { mode: 'production' }}
 */
export const isProduction = argv => argv.mode === 'production'
