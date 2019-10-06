const path = require('path')
const CopyWebpackPlugin = require('copy-webpack-plugin')

module.exports = {
  mode: 'production',
  optimization: {
    minimize: false,
  },
  entry: {
    main: path.resolve('./src/main.js'),
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
    new CopyWebpackPlugin([
      {
        from: 'background.js',
        context: 'src',
        to: 'background.js',
      },
      {
        from: '*',
        context: 'src',
        ignore: '*.js',
      },
      {
        from: 'assets/icons/*.png',
        context: 'src',
        to: 'assets/icons/[name].[ext]',
      },
      {
        from: 'public/*',
        context: 'src',
        to: '[name].[ext]',
      },
    ]),
  ],
}
