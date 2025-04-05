import contentScriptConfig from './webpack.contentScript.config.mjs'
import serviceConfig from './webpack.service.config.mjs'

/**
 * Webpack configuration function
 * @param {Record<string, boolean | string>} env - Environment variables passed to webpack
 * @param {import('webpack').WebpackOptionsNormalized} argv - Webpack CLI arguments
 * @returns {import('webpack').Configuration} Webpack configuration object
 */
export default (env, argv) => {
  return [contentScriptConfig(env, argv), serviceConfig(env, argv)]
}
