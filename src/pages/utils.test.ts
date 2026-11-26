import { TextDirection, getTextDirection } from './utils'

describe('getTextDirection', () => {
  it.each([
    { name: 'english', uiLanguage: 'en-US', expected: TextDirection.LTR },
    { name: 'arabic', uiLanguage: 'ar', expected: TextDirection.RTL },
    {
      name: 'arabic with region',
      uiLanguage: 'ar-EG',
      expected: TextDirection.RTL,
    },
    {
      name: 'underscore region',
      uiLanguage: 'ar_SA',
      expected: TextDirection.RTL,
    },
    {
      name: 'unshipped rtl locale',
      uiLanguage: 'he',
      expected: TextDirection.LTR,
    },
  ])('$name ($uiLanguage) -> $expected', ({ uiLanguage, expected }) => {
    expect(getTextDirection(uiLanguage)).toBe(expected)
  })
})
