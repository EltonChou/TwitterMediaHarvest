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

const { EnvironmentPlugin, DefinePlugin } = webpack

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
  const RELEASE_NAME = makeReleaseName(BROWSER)
  const BROWSER_DIR = isSelfSign ? BROWSER + '-signed' : BROWSER
  const OUTPUT_DIR = resolve(process.cwd(), 'build', BROWSER_DIR)

  return merge(config, {
    mode: argv.mode,
    optimization: {
      minimize: isProduction,
      usedExports: true,
      sideEffects: false,
    },
    output: {
      path: OUTPUT_DIR,
    },
    plugins: [
      new EnvironmentPlugin({
        RELEASE: RELEASE_NAME,
        TARGET: BROWSER,
      }),
      new Dotenv({ path: isProduction ? '.env' : 'dev.env' }),
      new DefinePlugin({
        __BROWSER__: JSON.stringify(BROWSER),
        __DEV__: argv.mode === 'development',
      }),
    ],
  })
}
