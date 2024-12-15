/* eslint-disable @typescript-eslint/no-var-requires */
const path = require('path')
const baseConfig = require('./webpack.common.config')
const { merge } = require('webpack-merge')
const CopyPlugin = require('copy-webpack-plugin')
const PACKAGE = require('./package.json')

module.exports = (env, argv) => {
  const VERSION = PACKAGE.version
  const BROWSER = env.target.split('-')[0]
  const VERSION_NAME = `${VERSION} (${BROWSER})`

  return merge(baseConfig(env, argv), {
    name: 'service',
    output: {
      chunkFormat: false,
    },
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
      new CopyPlugin({
        patterns: [
          {
            from: 'manifest.json',
            context: 'src',
            to: '[name][ext]',
            transform: content => {
              let contentStr = content
                .toString()
                .replace('__MANIFEST_RELEASE_VERSION__', VERSION)
                .replace('__MANIFEST_VERSION_NAME__', VERSION_NAME)

              return Buffer.from(contentStr)
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
