import { makeReleaseName } from './utils/make-release-name.mjs'
import contentScriptConfig from './webpack.contentScript.config.mjs'
import serviceConfig from './webpack.service.config.mjs'
import { shouldZIP } from './webpack/utils.mjs'
import FileManagerPlugin from 'filemanager-webpack-plugin'
import path from 'path'

/**
 * Webpack configuration function
 * @param {Record<string, boolean | string>} env - Environment variables passed to webpack
 * @param {import('webpack').WebpackOptionsNormalized} argv - Webpack CLI arguments
 * @returns {import('webpack').Configuration} Webpack configuration object
 */
export default (env, argv) => {
  const isSelfSign = env['self-sign'] ?? false
  const BROWSER = env.target
  const BROWSER_DIR = isSelfSign ? BROWSER + '-signed' : BROWSER
  const OUTPUT_DIR = path.resolve(process.cwd(), 'build', BROWSER_DIR)
  const DIST_DIR = path.resolve(process.cwd(), 'dist')

  const configs = [contentScriptConfig(env, argv), serviceConfig(env, argv)]

  const filemanagerPlugin = new FileManagerPlugin({
    events: {
      onEnd: {
        mkdir: ['dist'],
        copy: [
          {
            source: path.resolve(process.cwd(), 'LICENSE'),
            destination: path.resolve(OUTPUT_DIR, 'LICENSE'),
          },
        ],
        archive: shouldZIP(env)
          ? [
              {
                source: OUTPUT_DIR,
                destination: path.join(
                  DIST_DIR,
                  `${makeReleaseName(BROWSER)}.zip`
                ),
                options: {
                  zlib: { level: 9 },
                  globOptions: {
                    ignore: ['*.map'],
                  },
                },
              },
            ]
          : [],
      },
    },
  })

  configs[configs.length - 1].plugins.push(filemanagerPlugin)

  return configs
}
