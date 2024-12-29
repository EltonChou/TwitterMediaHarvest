module.exports = function (api) {
  api.cache(true)

  return {
    presets: [
      [
        '@babel/preset-env',
        {
          debug: true,
          useBuiltIns: 'usage',
          corejs: { version: '3.39', proposals: true },
        },
      ],
    ],
  }
}
