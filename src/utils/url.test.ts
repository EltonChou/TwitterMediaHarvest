import { isObjectUrl } from './url'

test.each([
  { url: 'https://mediaharvest.app/xxx.json', expected: false },
  { url: 'blob:https://somewhre/some-uuid', expected: true },
  { url: 'file://storage/xxx.json', expected: false },
  { url: '', expected: false },
  { url: 'blob', expected: false },
])('$url is object url: $expect', ({ url, expected }) => {
  expect(isObjectUrl(url)).toBe(expected)
})
