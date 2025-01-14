import baseConfig from './webpack.common.config.mjs'
import MiniCssExtractPlugin from 'mini-css-extract-plugin'
import { resolve } from 'path'
import { merge } from 'webpack-merge'

export default (env, argv) => {
  return merge(baseConfig(env, argv), {
    name: 'content-script',
    entry: {
      main: resolve('./src/contentScript/main.ts'),
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
