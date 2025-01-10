import { WebextI18nPlugin, type WebextI18nPluginOptions } from './plugin'

type MessageInfo = {
  context?: string
  msgId: string
}
const baseOptions: Pick<WebextI18nPluginOptions, 'poDir'> = {
  poDir: 'locales',
}

describe('unit test for plugin', () => {
  it.each<{
    options: WebextI18nPluginOptions
    msgInfo: MessageInfo
    expectedMsgId: string
  }>([
    {
      options: baseOptions,
      msgInfo: {
        context: undefined,
        msgId: 'text',
      },
      expectedMsgId: 'text',
    },
    {
      options: baseOptions,
      msgInfo: {
        context: 'ctx',
        msgId: 'text',
      },
      expectedMsgId: 'ctx_text',
    },
    {
      options: {
        ...baseOptions,
        messageIdMaker: (msgId: string, _context?: string) => msgId,
      },
      msgInfo: {
        context: 'ctx',
        msgId: 'no_context',
      },
      expectedMsgId: 'no_context',
    },
  ])(
    "can make msgId '$expectedMsgId'",
    ({ options, msgInfo: { context, msgId }, expectedMsgId }) => {
      const plugin = new WebextI18nPlugin(options)
      expect(plugin.makeMsgId(msgId, context)).toBe(expectedMsgId)
    }
  )

  it.each<{
    options: WebextI18nPluginOptions
    context?: string
    isRaw: boolean
  }>([
    {
      options: { ...baseOptions, rawContexts: 'raw' },
      context: 'raw',
      isRaw: true,
    },
    {
      options: { ...baseOptions, rawContexts: 'app' },
      context: 'not_raw',
      isRaw: false,
    },
    {
      options: { ...baseOptions, rawContexts: /a\d+z$/ },
      context: 'a114514z',
      isRaw: true,
    },
    {
      options: { ...baseOptions, rawContexts: /a\d+z$/ },
      context: '1114514',
      isRaw: false,
    },
    {
      options: { ...baseOptions, rawContexts: [/raw/, 'arr'] },
      context: 'arr',
      isRaw: true,
    },
    {
      options: { ...baseOptions, rawContexts: [/raw/, 'nope'] },
      context: 'arr_not',
      isRaw: false,
    },
    {
      options: { ...baseOptions, rawContexts: [/raw/, 'nope'] },
      context: undefined,
      isRaw: false,
    },
  ])(
    'can check raw context context: "$context"',
    ({ options, context, isRaw }) => {
      const plugin = new WebextI18nPlugin(options)
      expect(plugin.isRawContext(context)).toBe(isRaw)
    }
  )
})
