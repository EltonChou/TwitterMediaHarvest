# @media-harvest/webext-i18n-loader

A webpack loader and plugin for transforming i18n function calls and emitting locale files compatible with the [Web Extension i18n API](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/i18n).

## Overview

Web extensions require `browser.i18n.getMessage()` to be called with a plain string message ID, but typical gettext-style i18n source code uses human-readable strings like `i18n('Hello, world!')`. This package bridges the two by:

The data flow is split into two roles:

**Hash consumers** — rewrite i18n call expressions in TypeScript source, replacing human-readable strings with short hash values, and register those hashes into the shared `HashStore`:

- **Transformer** (`transformer`) — a TypeScript compiler transformer. **Recommended**: integrates with `ts-loader` via `getCustomTransformers` and preserves source maps.
- **Loader** (`webext-i18n-loader`) — a webpack loader alternative to the transformer. Note that source map support is not fully implemented; prefer the transformer when accurate source maps matter.

**Hash generator / data producer** — reads the hashes accumulated in `HashStore` during compilation and produces locale output:

- **Plugin** (`WebextI18nPlugin`) — reads `.po` locale files and emits `_locales/<locale>/messages.json` using the same hash values, ready to be consumed by the web extension runtime.

The consumer (transformer or loader) must run before the plugin so that all hashes are registered in `HashStore` by the time the plugin emits locale files.

## Requirements

- Node.js >= 22
- webpack ^5
- TypeScript ^5

## How It Works

Given a TypeScript source file like:

```ts
i18n('Hello, world!')
i18n('Hello, world!', 'homepage')
i18n('Hello, {{name}}!', 'homepage', { name: 'Alice' })
```

The transformer rewrites matched call expressions by replacing string literals with their SHA-256-derived hashes (10 hex chars for `msgId`, 7 hex chars for context):

```ts
i18n('6a30f630de')
i18n('6a30f630de', '9f86d08')
i18n('6a30f630de', '9f86d08', { name: 'Alice' })
```

Non-matched functions and non-string arguments (e.g., placeholders) are left unchanged.

The plugin then reads your `.po` translation files and emits corresponding `_locales/<locale>/messages.json` files using the same hashes as message IDs, so `browser.i18n.getMessage("9f86d08_6a30f630de")` resolves to the correct translation at runtime.

## Usage

### Recommended: Transformer via `ts-loader` custom transformers

Pass `transformer` as a `getCustomTransformers` option to `ts-loader`. This keeps source maps intact.

```mjs
import {
  WebextI18nPlugin,
  transformer,
} from '@media-harvest/webext-i18n-loader'

export default {
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: [
          {
            loader: 'ts-loader',
            options: {
              getCustomTransformers: () => ({
                before: [
                  transformer({
                    config: { expressions: ['i18n', '_', /gettext/] },
                  }),
                ],
              }),
            },
          },
        ],
      },
    ],
  },
  plugins: [
    new WebextI18nPlugin({
      poDir: 'locales',
    }),
  ],
}
```

### Alternative: Webpack Loader

> **Note:** Source map support in the loader is not fully implemented. Use the transformer above when accurate source maps are needed.

```mjs
import { WebextI18nPlugin } from '@media-harvest/webext-i18n-loader'
import { createRequire } from 'module'

const require = createRequire(import.meta.url)

export default {
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: [
          // webext-i18n-loader must come BEFORE ts-loader (loaders run right-to-left)
          {
            loader: require.resolve('@media-harvest/webext-i18n-loader'),
            options: {
              expressions: ['i18n', '_', /gettext/],
            },
          },
          { loader: 'ts-loader' },
        ],
      },
    ],
  },
  plugins: [
    new WebextI18nPlugin({
      poDir: 'locales',
    }),
  ],
}
```

## Transformer Options

| Option        | Type                                     | Required | Description                                                                                                              |
| ------------- | ---------------------------------------- | -------- | ------------------------------------------------------------------------------------------------------------------------ |
| `expressions` | `string \| RegExp \| (string\|RegExp)[]` | Yes      | One or more patterns used to identify i18n call expressions. Any call whose expression text matches will be transformed. |

```ts
// Match a single function name
transformer({ config: { expressions: 'i18n' } })

// Match multiple names / patterns
transformer({ config: { expressions: ['i18n', '_', /^gettext/] } })
```

## Loader Options

Same as transformer options.

| Option        | Type                                     | Required | Description                                                                                                              |
| ------------- | ---------------------------------------- | -------- | ------------------------------------------------------------------------------------------------------------------------ |
| `expressions` | `string \| RegExp \| (string\|RegExp)[]` | Yes      | One or more patterns used to identify i18n call expressions. Any call whose expression text matches will be transformed. |

## Plugin Options (`WebextI18nPlugin`)

| Option           | Type                                          | Required | Default    | Description                                                                                                                                                                                                                 |
| ---------------- | --------------------------------------------- | -------- | ---------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `poDir`          | `string`                                      | Yes      | —          | Directory containing `.po` locale files. Each file should be named `<locale>.po` (e.g., `en_US.po`, `zh_TW.po`).                                                                                                            |
| `outDir`         | `string`                                      | No       | `_locales` | Output directory for emitted locale files. Each locale is written to `<outDir>/<locale>/messages.json`.                                                                                                                     |
| `rawContexts`    | `string \| RegExp \| (string\|RegExp)[]`      | No       | —          | Contexts matching these patterns are treated as **raw** — their `msgId` and context values are used as-is instead of being hashed. Useful for messages whose IDs must remain human-readable.                                |
| `messageIdMaker` | `(msgId: string, context?: string) => string` | No       | —          | Custom function to combine `msgId` and `context` into a final Web Extension message ID. Must return a string containing only `[a-zA-Z0-9_]`. Defaults to `context + '_' + msgId` when context is present, or `msgId` alone. |

### Default message ID format

| Has context | `rawContexts` match | Resulting message ID                         |
| ----------- | ------------------- | -------------------------------------------- |
| No          | —                   | `<msgIdHash>`                                |
| Yes         | No                  | `<ctxHash>_<msgIdHash>`                      |
| Yes         | Yes                 | `<context>_<msgId>` (raw values, no hashing) |

## Locale File Structure

Given a `locales/` directory:

```
locales/
  en_US.po
  zh_TW.po
```

The plugin emits (using the default `outDir: '_locales'`):

```
_locales/
  en_US/
    messages.json
  zh_TW/
    messages.json
```

Each `messages.json` follows the [Web Extension messages format](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/i18n/Locale-Specific_Message_reference):

```json
{
  "9f86d08_6a30f630de": {
    "message": "Hello, world!"
  }
}
```

## Exports

```ts
import loader from '@media-harvest/webext-i18n-loader'
// default: webpack loader
import { WebextI18nPlugin } from '@media-harvest/webext-i18n-loader'
import { transformer } from '@media-harvest/webext-i18n-loader'
```

## License

MIT
