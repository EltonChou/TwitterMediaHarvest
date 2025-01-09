import { getText, getTextPlural } from './i18n'
import { i18n } from 'webextension-polyfill'

test('getText', () => {
  jest.spyOn(i18n, 'getMessage').mockReturnValueOnce('This is {{fruit}}.')
  expect(getText('This is {{fruit}}.', 'test', { fruit: 'apple' })).toBe(
    'This is apple.'
  )

  jest.spyOn(i18n, 'getMessage').mockReturnValueOnce('This is apple.')
  expect(getText('This is apple.', 'test')).toBe('This is apple.')

  jest.restoreAllMocks()
})

test('getTextPlural', () => {
  jest
    .spyOn(i18n, 'getMessage')
    .mockReturnValueOnce('There are {{n}} apples in {{container}}.')
  expect(
    getTextPlural(
      5,
      'There is {{n}} apple in {{container}}.',
      'There are {{n}} apples in {{container}}.',
      'test',
      { container: 'box' }
    )
  ).toBe('There are 5 apples in box.')

  jest.spyOn(i18n, 'getMessage').mockReturnValueOnce('There is 1 apple.')
  expect(
    getTextPlural(1, 'There is {{n}} apple.', 'There are {{n}} apples.', 'test')
  ).toBe('There is 1 apple.')

  jest.restoreAllMocks()
})
