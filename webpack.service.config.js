/* eslint-disable @typescript-eslint/no-var-requires */
const path = require('path')
const baseConfig = require('./webpack.common.config')
const { merge } = require('webpack-merge')
const CopyPlugin = require('copy-webpack-plugin')
const { LimitChunkCountPlugin } = require('webpack').optimize

module.exports = (env, argv) => {
  return merge(baseConfig(env, argv), {
    name: 'service',
    output: {
      chunkFormat: false
    },
    // optimization: {
    //   splitChunks: {
    //     cacheGroups: {
    //       defaultVendors: {
    //         test: /[\\/]node_modules[\\/]/,
    //         name: 'vendors-npm',
    //         chunks: 'all',
    //       },
    //       commons: {
    //         test: /[\\/]src[\\/](domain|enums|helpers|libs|mappers|utils|applicationUseCases|infra|provider)[\\/]/,
    //         name: 'vendors-common',
    //         chunks: 'all',
    //       },
    //     },
    //   },
    // },
    entry: {
      sw: path.resolve('./src/serviceWorker/sw.ts'),
      pages: path.resolve('./src/pages/index.tsx'),
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
      new LimitChunkCountPlugin({ maxChunks: 1 }),
      new CopyPlugin({
        patterns: [
          {
            from: 'manifest.json',
            context: 'src',
            to: '[name][ext]',
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
          {
            from: '_locales',
            context: 'src',
            to: '_locales',
          },
        ],
      }),
    ],
  })
}
