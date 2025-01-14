import baseConfig from '@media-harvest-config/prettier'

/** @type {import('prettier').Config} */
const config = {
  ...baseConfig,
  overrides: [
    {
      files: '*.json',
      options: {
        tabWidth: 4,
      },
    },
  ],
}

export default config
