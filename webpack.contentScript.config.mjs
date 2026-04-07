import baseConfig from './webpack.common.config.mjs'
import MiniCssExtractPlugin from 'mini-css-extract-plugin'
import { resolve } from 'path'
import { merge } from 'webpack-merge'

/**
 * Webpack configuration function
 * @param {Record<string, boolean | string>} env - Environment variables passed to webpack
 * @param {import('webpack').WebpackOptionsNormalized} argv - Webpack CLI arguments
 * @returns {import('webpack').Configuration} Webpack configuration object
 */
export default (env, argv) => {
  return merge(baseConfig(env, argv), {
    name: 'content-script',
    entry: {
      main: resolve('./src/contentScript/main.ts'),
      inject: resolve('./src/injections/injectFetch.ts'),
    },
    plugins: [new MiniCssExtractPlugin()],
    module: {
      rules: [
        {
          test: /\.(sa|sc|c)ss$/,
          use: [MiniCssExtractPlugin.loader, 'css-loader', 'sass-loader'],
        },
        {
          test: /\.svg$/,
          loader: 'svg-inline-loader',
        },
      ],
    },
  })
}
