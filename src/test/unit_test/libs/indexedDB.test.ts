import { versionToRun } from '@libs/indexedDB'

test('migration version generator unit test', () => {
  expect(new Set(versionToRun(4, 7))).toEqual(new Set([5, 6, 7]))
})
