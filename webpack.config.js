/* eslint-disable @typescript-eslint/no-var-requires */
const path = require('path')
const CopyPlugin = require('copy-webpack-plugin')
const FileManagerPlugin = require('filemanager-webpack-plugin')
const PACKAGE = require('./package.json')
const PublicKey = require('./public_key.json')
const webpack = require('webpack')
const version = PACKAGE.version

const config = {
  mode: 'production',
  stats: 'errors-only',
  devtool: 'source-map',
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
    fallback: { path: require.resolve('path-browserify') },
  },
  optimization: {
    minimize: true,
  },
  entry: {
    main: path.resolve('./src/content_script/main.ts'),
    sw: path.resolve('./src/backend/sw.ts'),
    options: path.resolve('./src/backend/options.ts'),
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
          options: {
            presets: ['@babel/preset-env'],
          },
        },
      },
      {
        test: /\.ts$/,
        exclude: /(node_modules)/,
        use: [
          {
            loader: 'babel-loader',
            options: { presets: ['@babel/preset-env'] },
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
          from: 'backend/pages/*',
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
}

module.exports = (env, argv) => {
  config.output = {
    filename: '[name].js',
    path: path.join(__dirname, 'build', env.target),
    clean: true,
  }

  config.plugins.push(
    new CopyPlugin({
      patterns: [
        {
          from: 'manifest.json',
          context: 'src',
          to: '[name][ext]',
          transform: content =>
            content
              .toString()
              .replace('__MANIFEST_RELEASE_VERSION__', version)
              .replace('__PUBLIC_KEY__', PublicKey[env.target])
          ,
        },
      ],
    }),
    new webpack.EnvironmentPlugin({
      RELEASE: env.RELEASE_NAME || PACKAGE.name + '('+ env.target + ')' + '@' + version,
    })
  )

  if (argv.mode === 'development') {
    config.mode = 'development'
    config.optimization.minimize = false
    config.stats = 'errors-warnings'
    config.devtool = 'inline-source-map'
  }

  if (argv.mode === 'production') {
    config.plugins.push(
      new FileManagerPlugin({
        events: {
          onEnd: {
            mkdir: ['dist'],
            archive: [
              {
                source: 'build',
                destination: `dist/${env.target}-TwitterMediaHarvest-v${version}.zip`,
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

  return config
}
