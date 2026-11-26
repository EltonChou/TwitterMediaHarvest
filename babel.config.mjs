export default function (api) {
  api.cache(true)

  return {
    presets: [
      ['@babel/preset-env'],
      [
        '@babel/preset-react',
        {
          runtime: 'automatic',
        },
      ],
    ],
    plugins: [
      'babel-plugin-react-compiler', // must run first
      ['polyfill-corejs3', { method: 'usage-global', version: '3.48' }],
    ],
  }
}
