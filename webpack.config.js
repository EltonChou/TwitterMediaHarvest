/* eslint-disable @typescript-eslint/no-var-requires */
const path = require('path')
const CopyPlugin = require('copy-webpack-plugin')
const Dotenv = require('dotenv-webpack')
const FileManagerPlugin = require('filemanager-webpack-plugin')
// const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin
const PACKAGE = require('./package.json')
const PublicKey = require('./public_key.json')
const webpack = require('webpack')
const VERSION = PACKAGE.version

const config = {
  experiments: {
    topLevelAwait: true,
  },
  mode: 'production',
  target: 'web',
  stats: 'errors-only',
  devtool: 'source-map',
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
    fallback: {
      path: require.resolve('path-browserify'),
      crypto: require.resolve('crypto-browserify'),
      stream: require.resolve('stream-browserify'),
      util: require.resolve('util/'),
    },
    alias: {
      '@backend': path.resolve(__dirname, 'src/backend/'),
      '@pages': path.resolve(__dirname, 'src/pages/'),
      '@libs': path.resolve(__dirname, 'src/libs/'),
    },
  },
  optimization: {
    minimize: true,
  },
  entry: {
    main: path.resolve('./src/content_script/main.ts'),
    sw: path.resolve('./src/service_worker/sw.ts'),
    index: path.resolve('./src/pages/index.tsx'),
  },
  output: {
    filename: '[name].js',
    path: path.join(__dirname, 'build'),
    clean: true,
  },
  module: {
    rules: [
      {
        test: /\.(sa|sc|c)ss$/,
        use: ['style-loader', 'css-loader', 'sass-loader'],
      },
      {
        test: /\.js$/,
        exclude: /(node_modules)/,
        use: {
          loader: 'babel-loader',
        },
      },
      {
        test: /\.(ts|tsx)$/,
        exclude: /(node_modules)/,
        use: [
          {
            loader: 'babel-loader',
          },
          { loader: 'ts-loader' },
        ],
      },
      {
        test: /\.svg$/,
        loader: 'svg-inline-loader',
      },
      {
        test: /\.(ttf|eot|woff|woff2)$/,
        use: {
          loader: 'file-loader',
          options: {
            name: 'fonts/[name].[ext]',
          },
        },
      },
    ],
  },
  plugins: [
    new CopyPlugin({
      patterns: [
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
  devServer: {
    port: '9000',
    static: {
      directory: path.join(__dirname, 'build/chrome'),
    },
    open: true,
    hot: true,
    liveReload: true,
    compress: true,
  },
}

const makeFirefoxManifestCopyPlugin = (
  isProduction,
  isSelfSigned,
  version,
  versionName
) =>
  new CopyPlugin({
    patterns: [
      {
        from: 'manifest_firefox.json',
        context: 'src',
        to: 'manifest[ext]',
        transform: content => {
          let contentStr = content
            .toString()
            .replace('__MANIFEST_RELEASE_VERSION__', version)
            .replace('__MANIFEST_VERSION_NAME__', versionName)

          if (!isProduction) {
            contentStr = contentStr.replace(
              'mediaharvest@addons.mozilla.org',
              'mediaharvest@test'
            )
          }

          if (isSelfSigned && isProduction) {
            contentStr = contentStr.replace(
              'mediaharvest@addons.mozilla.org',
              'mediaharvest@mediaharvest.app'
            )
          }

          return Buffer.from(contentStr)
        },
      },
    ],
  })

const makeChromiumManifestCopyPlugin = (
  isProduction,
  version,
  versionName,
  buildTarget
) =>
  new CopyPlugin({
    patterns: [
      {
        from: 'manifest.json',
        context: 'src',
        to: '[name][ext]',
        transform: content => {
          const contentJson = JSON.parse(content.toString())
          contentJson['version'] = version
          contentJson['version_name'] = versionName

          if (
            (buildTarget === 'chrome' && isProduction) ||
            (buildTarget === 'edge' && !isProduction)
          ) {
            contentJson['key'] = PublicKey[buildTarget]
          }

          if (!isProduction) contentJson['name'] = 'MH-Dev'

          return Buffer.from(JSON.stringify(contentJson))
        },
      },
    ],
  })

module.exports = (env, argv) => {
  const BUILD_TARGET = env.target
  const BROWSER = env.target.split('-')[0]
  const VERSION_NAME = `${VERSION} (${BROWSER})`
  const RELEASE_NAME =
    env.RELEASE_NAME || PACKAGE.name + '(' + BROWSER + ')' + '@' + VERSION
  const OUTPUT_DIR = path.join(__dirname, 'build', BUILD_TARGET)
  const DIST_DIR = path.join(__dirname, 'dist')

  const isProduction = argv.mode === 'production'
  const shouldZip = !BUILD_TARGET.endsWith('signed')

  config.resolve.alias['@init'] = path.resolve(
    __dirname,
    'src',
    'service_worker',
    BROWSER,
    'initialization.ts'
  )

  config.output = {
    filename: '[name].js',
    path: path.join(__dirname, 'build', env.target),
    clean: true,
  }

  config.plugins.push(
    BUILD_TARGET.includes('firefox')
      ? makeFirefoxManifestCopyPlugin(
          isProduction,
          BUILD_TARGET.endsWith('signed'),
          VERSION,
          VERSION_NAME
        )
      : makeChromiumManifestCopyPlugin(isProduction, VERSION, VERSION_NAME, BUILD_TARGET),
    new webpack.EnvironmentPlugin({
      RELEASE: RELEASE_NAME,
      TARGET: BROWSER,
      VERSION_NAME: VERSION_NAME,
    })
  )

  if (!isProduction) {
    config.mode = 'development'
    config.optimization.minimize = false
    config.stats = 'errors-warnings'
    config.devtool = 'inline-source-map'
    // config.plugins.push(new BundleAnalyzerPlugin())
    config.performance = {
      hints: false,
      maxAssetSize: 1000000,
      maxEntrypointSize: 400000,
    }
    config.plugins.push(new Dotenv({ path: 'dev.env' }))
  }

  if (isProduction) {
    config.plugins.push(
      new Dotenv(),
      shouldZip &&
        new FileManagerPlugin({
          events: {
            onEnd: {
              mkdir: ['dist'],
              archive: [
                {
                  source: OUTPUT_DIR,
                  destination: path.join(
                    DIST_DIR,
                    `${BUILD_TARGET}-TwitterMediaHarvest-v${VERSION}.zip`
                  ),
                  options: {
                    zlib: { level: 9 },
                    globOptions: {
                      ignore: ['*.map'],
                    },
                  },
                },
              ],
            },
          },
        })
    )
  }
  // config.plugins.push(new BundleAnalyzerPlugin())

  return config
}
