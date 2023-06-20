/* eslint-disable @typescript-eslint/no-var-requires */
const path = require('path')
const CopyPlugin = require('copy-webpack-plugin')
const Dotenv = require('dotenv-webpack')
const FileManagerPlugin = require('filemanager-webpack-plugin')
// const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin
const PACKAGE = require('./package.json')
const PublicKey = require('./public_key.json')
const webpack = require('webpack')
const version = PACKAGE.version

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
    },
  },
  optimization: {
    minimize: true,
  },
  entry: {
    main: path.resolve('./src/content_script/main.ts'),
    sw: path.resolve('./src/backend/sw.ts'),
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
          // options: {
          //   presets: ['@babel/preset-env'],
          // },
        },
      },
      {
        test: /\.(ts|tsx)$/,
        exclude: /(node_modules)/,
        use: [
          {
            loader: 'babel-loader',
            // options: { presets: ['@babel/preset-env'] },
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

module.exports = (env, argv) => {
  const isProduction = argv.mode === 'production'
  const versionName = `${version} (${env.target})`
  const release_name = env.RELEASE_NAME || PACKAGE.name + '(' + env.target + ')' + '@' + version

  config.output = {
    filename: '[name].js',
    path: path.join(__dirname, 'build', env.target),
    clean: true,
  }

  const chromiumManifestCopyPlugin = new CopyPlugin({
    patterns: [
      {
        from: 'manifest.json',
        context: 'src',
        to: '[name][ext]',
        transform: content => {
          const contentJson = JSON.parse(content.toString())
          contentJson['version'] = version
          contentJson['version_name'] = versionName

          if ((env.target === 'chrome' && isProduction) || (env.target === 'edge' && !isProduction)) {
            contentJson['key'] = PublicKey[env.target]
          }

          if (!isProduction) contentJson['name'] = 'MH-Dev'

          return Buffer.from(JSON.stringify(contentJson))
        },
      },
    ],
  })

  const firefoxManifestCopyPlugin = new CopyPlugin({
    patterns: [
      {
        from: 'manifest_firefox.json',
        context: 'src',
        to: 'manifest[ext]',
        transform: content =>
          content
            .toString()
            .replace('__MANIFEST_RELEASE_VERSION__', version)
            .replace('__MANIFEST_VERSION_NAME__', versionName),
      },
    ],
  })

  config.plugins.push(
    env.target === 'firefox' ? firefoxManifestCopyPlugin : chromiumManifestCopyPlugin,
    new webpack.EnvironmentPlugin({
      RELEASE: release_name,
      TARGET: env.target,
      VERSION_NAME: versionName,
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
      new FileManagerPlugin({
        events: {
          onEnd: {
            mkdir: ['dist'],
            archive: [
              {
                source: `build/${env.target}`,
                destination: `dist/${env.target}-TwitterMediaHarvest-v${version}.zip`,
                options: {
                  zlib: { level: 9 },
                  globOptions: {
                    ignore: ['*.map', '*.txt'],
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
