import { type HashStore, getHashStore } from './hashStore'
import fs from 'fs/promises'
import { glob } from 'glob'
import process from 'node:process'
import path from 'path'
import { validate } from 'schema-utils'
import { Compilation, sources } from 'webpack'
import type { Compiler, WebpackPluginInstance } from 'webpack'

const { RawSource } = sources

type Translation = {
  context?: string
  msgId: string
  content: string
}

type WebextTranslations = {
  [msgId: string]: WebextLocalMessage
}

type WebextLocalMessage = {
  message: string
}

export interface WebextI18nPluginOptions {
  poDir: string
  rawContexts?: string | RegExp | (string | RegExp)[]
  /**
   * If context is matched in {@link rawContexts},
   * `msg` and `context` will be passed as raw values instead of hash values.
   *
   * default maker:
   * @example
   * const defaultMaker = (msg: string, context?: string) => context + '_' + msg
   *
   * @param {string} msgId
   * @param {string} context
   * @returns {string} Output should only contains `[a-z][A-Z][0-9]` and `_`
   */
  messageIdMaker?: (msgId: string, context?: string) => string
}

export class WebextI18nPlugin implements WebpackPluginInstance {
  readonly hashStore: HashStore

  constructor(readonly options: WebextI18nPluginOptions) {
    validate(
      {
        type: 'object',
        required: ['poDir'],
        additionalProperties: false,
        properties: {
          poDir: { type: 'string' },
          rawContexts: {
            oneOf: [
              {
                type: 'array',
                items: {
                  anyof: [{ type: 'string' }, { instanceof: 'RegExp' }],
                },
              },
              { type: 'string' },
              { instanceof: 'RegExp' },
            ],
          },
          messageIdMaker: {
            instanceof: 'Function',
          },
        },
      },
      options
    )
    this.options = options
    this.hashStore = getHashStore()
  }

  isRawContext(context?: string): boolean {
    if (this.options.rawContexts === undefined || context === undefined)
      return false
    return Array.isArray(this.options.rawContexts)
      ? this.options.rawContexts.some(
          rawContext => context.match(rawContext) !== null
        )
      : context.match(this.options.rawContexts) !== null
  }

  makeMsgId(msgId: string, context?: string): string {
    if (this.options.messageIdMaker)
      return this.options.messageIdMaker(msgId, context)

    return context ? context + '_' + msgId : msgId
  }

  transformToLocaleMsgId(hashStore: HashStore) {
    return (msgId: string, context?: string): string => {
      if (context === undefined || context === null)
        return this.makeMsgId(hashStore.getMsgIdHash(msgId) ?? msgId)

      if (this.isRawContext(context)) {
        return this.makeMsgId(msgId, context)
      } else {
        const ctxHash = hashStore.getContextHash(context)
        const msgIdHash = hashStore.getMsgIdHash(msgId)
        return this.makeMsgId(msgIdHash ?? msgId, ctxHash ?? context)
      }
    }
  }

  apply(compiler: Compiler) {
    const pluginName = this.constructor.name
    const hashStore = this.hashStore

    compiler.hooks.thisCompilation.tap({ name: pluginName }, compilation => {
      const logger = compilation.getLogger('webext-i18n-plugin')
      // const cache = compilation.getCache(pluginName)

      compilation.hooks.processAssets.tapPromise(
        {
          name: pluginName,
          stage: Compilation.PROCESS_ASSETS_STAGE_ADDITIONAL,
          additionalAssets: true,
        },
        async _unusedAssets => {
          logger.log(`Finding po files from ${this.options.poDir}`)
          const localePoMap = new Map<string, string>()

          const poFiles = await glob(path.resolve(this.options.poDir, '*.po'), {
            windowsPathsNoEscape: isWindows(),
          })

          compilation.fileDependencies.addAll(poFiles)

          for (const file of poFiles) {
            const locale = parseLocaleName(file)
            localePoMap.set(locale, file)
          }

          for (const [locale, poFile] of localePoMap.entries()) {
            logger.log(`Parsing locale: ${locale} from ${poFile}`)

            const translations = await readTranslationsFromPo(poFile)
            const webextTranslationEntries = translations.map<
              [string, WebextLocalMessage]
            >(translation => [
              this.transformToLocaleMsgId(hashStore)(
                translation.msgId,
                translation.context
              ),
              { message: translation.content },
            ])
            const webextTranslations: WebextTranslations = Object.fromEntries(
              webextTranslationEntries
            )

            const outputFile = path.join('_locales', locale, 'messages.json')

            compilation.emitAsset(
              outputFile,
              new RawSource(JSON.stringify(webextTranslations)),
              {
                javascriptModule: false,
                sourceFilename: path.relative(compiler.context, poFile),
              }
            )
          }
        }
      )
    })
  }
}

function parseLocaleName(poFilename: string) {
  return path.basename(poFilename, '.po')
}

async function readTranslationsFromPo(poFile: string): Promise<Translation[]> {
  const poContent = await fs.readFile(path.resolve(poFile))
  const { po } = await import('gettext-parser')
  const content = po.parse(poContent)

  const translations: Translation[] = []
  for (const contextObject of Object.values(content.translations)) {
    for (const [msgId, translation] of Object.entries(contextObject)) {
      if (msgId === '') break
      translations.push({
        content: translation.msgstr.at(0) ?? '',
        msgId: translation.msgid,
        context: translation.msgctxt,
      })
    }
  }

  return translations
}

function isWindows(): boolean {
  return process.platform === 'win32'
}
