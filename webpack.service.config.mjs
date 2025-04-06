import PACKAGE from './package.json' with { type: 'json' }
import PublicKey from './public_key.json' with { type: 'json' }
import baseConfig from './webpack.common.config.mjs'
import {
  getTarget,
  isProduction as isProductionMode,
} from './webpack/utils.mjs'
import { WebextI18nPlugin } from '@media-harvest/webext-i18n-loader'
import CopyPlugin from 'copy-webpack-plugin'
import { resolve } from 'path'
import { merge } from 'webpack-merge'

const { version } = PACKAGE

const appendDevelopmentManifestAttributes = manifest => {
  return {
    ...manifest,
    ...{
      web_accessible_resources: [
        {
          resources: ['*.map'],
          matches: ['<all_urls>'],
        },
      ],
    },
  }
}

/**
 * @param {unknown} manifest
 * @param {string} addOnId
 * @returns
 */
const appendFirefoxSpecificManifestAttributes = (manifest, addOnId) => {
  return {
    ...manifest,
    ...{
      browser_specific_settings: {
        gecko: {
          id: addOnId,
          strict_min_version: '90.0',
        },
      },
    },
  }
}

/**
 * Webpack configuration function
 * @param {Record<string, boolean | string>} env - Environment variables passed to webpack
 * @param {import('webpack').WebpackOptionsNormalized} argv - Webpack CLI arguments
 * @returns {import('webpack').Configuration} Webpack configuration object
 */
export default (env, argv) => {
  const isProduction = isProductionMode(argv)
  const VERSION = version
  const BROWSER = getTarget(env)
  const VERSION_NAME = `${VERSION} (${BROWSER})`
  const isSelfSign = 'self-sign' in env
  const isFirefox = BROWSER === 'firefox'
  const isChrome = BROWSER === 'chrome'
  const isEdge = BROWSER === 'edge'
  const isChromium = isChrome || isEdge

  return merge(baseConfig(env, argv), {
    name: 'service',
    output: {
      chunkFormat: false,
    },
    entry: {
      sw: resolve('./src/serviceWorker/sw.ts'),
      pages: resolve('./src/pages/index.tsx'),
    },
    module: {
      rules: [
        {
          test: /\.(sa|sc|c)ss$/,
          use: ['style-loader', 'css-loader', 'sass-loader'],
        },
      ],
    },
    plugins: [
      new WebextI18nPlugin({
        poDir: resolve(process.cwd(), 'locales'),
      }),
      new CopyPlugin({
        patterns: [
          {
            from: isChromium ? 'manifest.json' : 'manifest_firefox_v3.json',
            context: 'src',
            to: 'manifest.json',
            transform: content => {
              let manifest = JSON.parse(content.toString())

              manifest['version'] = VERSION
              manifest['version_name'] = VERSION_NAME

              if (!isProduction) {
                manifest = appendDevelopmentManifestAttributes(manifest)
              }

              if (isChrome && isProduction) {
                manifest['key'] = PublicKey.chrome
              }

              if (isEdge && !isProduction) {
                manifest['key'] = PublicKey.edge
              }

              if (isFirefox) {
                if (isProduction) {
                  manifest = appendFirefoxSpecificManifestAttributes(
                    manifest,
                    isSelfSign
                      ? 'mediaharvest@mediaharvest.app'
                      : 'mediaharvest@addons.mozilla.org'
                  )
                } else {
                  manifest = appendFirefoxSpecificManifestAttributes(
                    manifest,
                    'mediaharvest@development'
                  )
                }
              }

              return Buffer.from(JSON.stringify(manifest))
            },
          },
          {
            from: 'assets/icons/*.png',
            context: 'src',
            to: 'assets/icons/[name][ext]',
          },
          {
            from: 'pages/*.html',
            context: 'src',
            to: '[name][ext]',
          },
        ],
      }),
    ],
  })
}
