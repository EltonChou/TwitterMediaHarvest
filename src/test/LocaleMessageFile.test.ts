import en from '../_locales/en/messages.json'
import ja from '../_locales/ja/messages.json'
import zh_TW from '../_locales/zh_TW/messages.json'

describe('i18n dictionary test', () => {
  it('ja dictionary is compatiable', () => {
    expect(Object.keys(ja)).toStrictEqual(Object.keys(en))
  })

  it('zh_TW dictionary is compatiable', () => {
    expect(Object.keys(zh_TW)).toStrictEqual(Object.keys(en))
  })
})
