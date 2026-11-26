export default function (api) {
  const isDev = api.env('development')

  return {
    presets: [
      ['@babel/preset-env'],
      [
        '@babel/preset-react',
        {
          runtime: 'automatic',
          development: isDev,
        },
      ],
    ],
    plugins: [
      'babel-plugin-react-compiler', // must run first
      ['polyfill-corejs3', { method: 'usage-global', version: '3.48' }],
    ],
  }
}
