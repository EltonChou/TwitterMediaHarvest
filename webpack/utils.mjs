/**
 * @param {import('webpack').WebpackOptionsNormalized} argv - Webpack CLI arguments
 * @returns {import('webpack').WebpackOptionsNormalized & { mode: 'production' }}
 */
export const isProduction = argv => argv.mode === 'production'

/**
 * @param {Record<string, boolean | string>} env - Environment variables passed to webpack
 * @returns {string}
 * @throws {Error} If target is not defined or not a string
 */
export const getTarget = env => {
  const target = env.target
  if (!target || typeof target !== 'string') {
    throw new Error('Target must be defined and must be a string')
  }
  return target
}

/**
 * @param {Record<string, boolean | string>} env - Environment variables passed to webpack
 * @returns {boolean}
 */
export const shouldZIP = env => Boolean(env.zip)
