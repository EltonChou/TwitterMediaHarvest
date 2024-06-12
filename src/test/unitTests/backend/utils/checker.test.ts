import { shouldHandleDownloadDelta } from '@backend/utils/checker'

const runtimeId = 'id'

const mockDownload = jest.fn()

jest.mock('webextension-polyfill', () => {
  return {
    runtime: {
      id: runtimeId,
    },
    downloads: {
      search: jest.fn(async () => await mockDownload()),
    },
  }
})

test('download delta checker', async () => {
  mockDownload.mockResolvedValue([
    {
      byExtensionId: runtimeId,
      mime: 'image/png',
    },
  ])

  expect(await shouldHandleDownloadDelta(1)).toBeTruthy()

  mockDownload.mockResolvedValue([
    {
      byExtensionId: 'not',
      mime: 'image/png',
    },
  ])

  expect(await shouldHandleDownloadDelta(1)).toBeFalsy()

  mockDownload.mockResolvedValue([
    {
      byExtensionId: runtimeId,
      mime: 'application/json',
    },
  ])

  expect(await shouldHandleDownloadDelta(1)).toBeFalsy()
})
