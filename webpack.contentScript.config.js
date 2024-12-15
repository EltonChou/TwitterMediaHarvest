/* eslint-disable @typescript-eslint/no-var-requires */
const path = require('path')
const baseConfig = require('./webpack.common.config')
const { merge } = require('webpack-merge')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')

module.exports = (env, argv) => {
  return merge(baseConfig(env, argv), {
    name: 'content-script',
    entry: {
      main: path.resolve('./src/contentScript/main.ts'),
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
