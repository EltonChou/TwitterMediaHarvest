import type { LoaderContext } from 'webpack'

export type LoaderOptions = {
  expressions: string | RegExp | (RegExp | string)[]
}

export const getOptions = (
  loaderContext: LoaderContext<LoaderOptions>
): LoaderOptions =>
  loaderContext.getOptions({
    type: 'object',
    properties: {
      expressions: {
        anyOf: [
          { type: 'array' },
          { type: 'string' },
          { instanceof: 'RegExp' },
        ],
      },
    },
    additionalProperties: false,
  })
