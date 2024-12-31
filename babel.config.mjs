export default function (api) {
  api.cache(true)

  return {
    presets: [
      [
        '@babel/preset-env',
        {
          useBuiltIns: 'usage',
          corejs: { version: '3.39', proposals: true },
        },
      ],
    ],
  }
}
