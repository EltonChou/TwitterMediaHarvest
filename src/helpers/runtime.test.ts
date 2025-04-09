import { isFirefox } from './runtime'

test('firefox check', () => {
  process.env.TARGET = 'firefox'
  expect(isFirefox()).toBeTruthy()
  process.env.TARGET = 'chrome'
  expect(isFirefox()).not.toBeTruthy()
  process.env.TARGET = ''
})
