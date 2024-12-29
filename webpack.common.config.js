/* eslint-disable @typescript-eslint/no-var-requires */
const path = require('path')
const TsconfigPathsPlugin = require('tsconfig-paths-webpack-plugin')
const { merge } = require('webpack-merge')
const { EnvironmentPlugin } = require('webpack')
const Dotenv = require('dotenv-webpack')
const PACKAGE = require('./package.json')

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
    path: path.join(__dirname, 'build'),
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
          { loader: 'ts-loader' },
        ],
      },
    ],
  },
}

module.exports = (env, argv) => {
  const isProduction = argv.mode === 'production'

  // Define environment variable
  const VERSION = PACKAGE.version
  const BUILD_TARGET = env.target
  const BROWSER = env.target.split('-')[0]
  const VERSION_NAME = `${VERSION} (${BROWSER})`
  const RELEASE_NAME =
    env.RELEASE_NAME || PACKAGE.name + '(' + BROWSER + ')' + '@' + VERSION
  const OUTPUT_DIR = path.join(__dirname, 'build', BUILD_TARGET)

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
