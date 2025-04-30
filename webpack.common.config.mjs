import { makeReleaseName } from './utils/make-release-name.mjs'
import { isProduction as isProductionMode } from './webpack/utils.mjs'
import { transformer as i18nTransformer } from '@media-harvest/webext-i18n-loader'
import Dotenv from 'dotenv-webpack'
import { createRequire } from 'node:module'
import process from 'node:process'
import { resolve } from 'path'
import TsconfigPathsPlugin from 'tsconfig-paths-webpack-plugin'
import webpack from 'webpack'
import { merge } from 'webpack-merge'

const require = createRequire(import.meta.url)

const { DefinePlugin } = webpack

/** @type {import('webpack').Configuration} */
const config = {
  stats: 'normal',
  devtool: 'source-map',
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
    extensionAlias: {
      '.js': ['.js', '.ts'],
      '.cjs': ['.cjs', '.cts'],
      '.mjs': ['.mjs', '.mts'],
    },
    fallback: {
      path: require.resolve('path-browserify'),
    },
    plugins: [new TsconfigPathsPlugin()],
  },
  output: {
    filename: '[name].js',
    path: resolve(process.cwd(), 'build'),
    compareBeforeEmit: false,
  },
  module: {
    rules: [
      {
        test: /\.([cm]?ts|tsx)$/,
        exclude: [/node_modules/, /\.test\./],
        use: [
          {
            loader: 'babel-loader',
          },
          {
            loader: 'ts-loader',
            options: {
              getCustomTransformers: () => ({
                before: [
                  i18nTransformer({
                    config: {
                      expressions: ['i18n', 'getText', '_'],
                    },
                  }),
                ],
              }),
            },
          },
        ],
      },
    ],
  },
}

/**
 * Webpack configuration function
 * @param {Record<string, boolean | string>} env - Environment variables passed to webpack
 * @param {import('webpack').WebpackOptionsNormalized} argv - Webpack CLI arguments
 * @returns {import('webpack').Configuration} Webpack configuration object
 */
export default (env, argv) => {
  const isProduction = isProductionMode(argv)
  const isSelfSign = env['self-sign'] ?? false
  const BROWSER = env.target
  const BROWSER_DIR = isSelfSign ? BROWSER + '-signed' : BROWSER
  const OUTPUT_DIR = resolve(process.cwd(), 'build', BROWSER_DIR)

  return merge(config, {
    mode: argv.mode,
    optimization: {
      minimize: isProduction,
      usedExports: true,
      sideEffects: true,
    },
    output: {
      path: OUTPUT_DIR,
    },
    plugins: [
      new Dotenv({ path: isProduction ? '.env' : 'dev.env' }),
      /**
       * string value should be wrapped by JSON.stringify
       */
      new DefinePlugin({
        __BROWSER__: JSON.stringify(BROWSER).toLowerCase().trim(),
        __DEV__: argv.mode === 'development',
        __PROD__: argv.mode === 'production',
        __RELEASE_NAME__: JSON.stringify(makeReleaseName(BROWSER)),
        __CHROME__: BROWSER === 'chrome',
        __FIREFOX__: BROWSER === 'firefox',
        __GECKO__: BROWSER === 'firefox',
        __EDGE__: BROWSER === 'edge',
        __CHROMIUM__: BROWSER === 'chrome' || BROWSER === 'edge',
        __SAFARI__: BROWSER === 'safari',
        __SENTRY_DEBUG__: false,
        __SENTRY_TRACING__: false,
        __RRWEB_EXCLUDE_IFRAME__: true,
        __RRWEB_EXCLUDE_SHADOW_DOM__: true,
        __SENTRY_EXCLUDE_REPLAY_WORKER__: true,
      }),
    ],
  })
}
