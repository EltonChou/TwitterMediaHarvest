const path = require('path')
const CopyPlugin = require('copy-webpack-plugin')

const config = {
  mode: 'production',
  stats: 'errors-only',
  resolve: {
    fallback: { path: require.resolve('path-browserify') },
  },
  optimization: {
    minimize: true,
  },
  entry: {
    main: path.resolve('./src/main.js'),
    background: path.resolve('./src/background.js'),
    options: path.resolve('./src/options.js'),
  },
  output: {
    filename: '[name].js',
    path: path.join(__dirname, 'build'),
    clean: true,
  },
  module: {
    rules: [
      {
        test: /\.sass$/,
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
        test: /\.svg$/,
        loader: 'svg-inline-loader',
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader'],
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
          from: '*',
          context: 'src',
          globOptions: {
            ignore: ['*.js'],
          },
        },
        {
          from: 'assets/icons/*.png',
          context: 'src',
          to: 'assets/icons/[name].[ext]',
        },
        {
          from: 'pages/*',
          context: 'src',
          to: '[name].[ext]',
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
  if (argv.mode === 'development') {
    config.mode = 'development'
    config.optimization.minimize = false
    config.stats = 'errors-warnings'
    config.devtool = 'inline-source-map'
  }
  return config
}
