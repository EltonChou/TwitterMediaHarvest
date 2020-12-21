const path = require('path')
const CopyPlugin = require('copy-webpack-plugin')

module.exports = {
  mode: 'production',
  stats: 'errors-warnings',
  resolve: {
    fallback: { path: require.resolve('path-browserify') },
  },
  optimization: {
    minimize: false,
  },
  entry: {
    main: path.resolve('./src/main.js'),
    background: path.resolve('./src/background.js'),
    options: path.resolve('./src/options.js'),
  },
  output: {
    filename: '[name].js',
    path: path.join(__dirname, 'build'),
  },
  module: {
    rules: [
      {
        test: /\.sass$/,
        use: ['style-loader', 'css-loader', 'sass-loader'],
      },
      {
        test: /\.js$/,
        exclude: /(node_modules|bower_componemts)/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env'],
            plugins: ['@babel/plugin-transform-runtime'],
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
