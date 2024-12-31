import CopyPlugin from 'copy-webpack-plugin'
import { resolve } from 'path'
import { merge } from 'webpack-merge'
import PACKAGE from './package.json' with { type: 'json' }
import baseConfig from './webpack.common.config.mjs'

const { version } = PACKAGE

export default (env, argv) => {
  const VERSION = version
  const BROWSER = env.target.split('-')[0]
  const VERSION_NAME = `${VERSION} (${BROWSER})`

  return merge(baseConfig(env, argv), {
    name: 'service',
    target: ['web', 'es6'],
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
