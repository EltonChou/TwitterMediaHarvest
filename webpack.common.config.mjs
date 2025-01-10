import PACKAGE from './package.json' with { type: 'json' }
import Dotenv from 'dotenv-webpack'
import { createRequire } from 'node:module'
import process from 'node:process'
import { resolve } from 'path'
import TsconfigPathsPlugin from 'tsconfig-paths-webpack-plugin'
import webpack from 'webpack'
import { merge } from 'webpack-merge'

const require = createRequire(import.meta.url)

const { name, version } = PACKAGE
const { EnvironmentPlugin } = webpack

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
            loader: '@media-harvest/webext-i18n-loader',
            options: {
              expressions: ['i18n', 'getText', '_'],
            },
          },
          { loader: 'ts-loader' },
        ],
      },
    ],
  },
}

export default (env, argv) => {
  const isProduction = argv.mode === 'production'

  // Define environment variable
  const VERSION = version
  const BUILD_TARGET = env.target
  const BROWSER = env.target.split('-')[0]
  const VERSION_NAME = `${VERSION} (${BROWSER})`
  const RELEASE_NAME =
    env.RELEASE_NAME || name + '(' + BROWSER + ')' + '@' + VERSION
  const OUTPUT_DIR = resolve(process.cwd(), 'build', BUILD_TARGET)

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
        VERSION_NAME: VERSION_NAME,
      }),
      new Dotenv({ path: isProduction ? '.env' : 'dev.env' }),
    ],
  })
}
