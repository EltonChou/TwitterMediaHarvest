/**
 * @jest-environment jsdom
 */
import type { DownloadItem } from '#domain/repositories/download'
import { CheckDownloadWasTriggeredBySelf } from '#domain/useCases/checkDownloadWasTriggeredBySelf'
import { MockDownloadRepo } from '#mocks/repositories/download'
import { generateDownloadItem } from '#utils/test/downloadItem'
import useObjectURLRevoker from './useObjectURLRevoker'
import { renderHook } from '@testing-library/react'
import { downloads } from 'webextension-polyfill'
import type { Downloads } from 'webextension-polyfill'

type Listener = (
  ...args: Parameters<ListenerOf<Downloads.Static['onChanged']>>
) => Promise<void>

const EXT_ID = 'EXT_ID'
const BLOB_URL = 'blob:https://x.com/0f8e1c4a-6b5d-4d6e-9c2a-1a2b3c4d5e6f'
const COMPLETED = { current: 'complete', previous: 'in_progress' }

describe('unit test for useObjectURLRevoker hook', () => {
  const mockRevokeObjectURL = jest.fn()
  const mockAddListener = jest.fn()
  const mockRemoveListener = jest.fn()

  beforeAll(() => {
    URL.revokeObjectURL = mockRevokeObjectURL
    downloads.onChanged = {
      addListener: mockAddListener,
      removeListener: mockRemoveListener,
      hasListener: jest.fn(),
    }
  })

  afterEach(() => jest.clearAllMocks())

  const setup = (item: DownloadItem | undefined) => {
    const downloadRepo = new MockDownloadRepo()
    jest.spyOn(downloadRepo, 'getById').mockResolvedValue(item)
    const hook = renderHook(() =>
      useObjectURLRevoker(
        downloadRepo,
        new CheckDownloadWasTriggeredBySelf(EXT_ID)
      )
    )
    const listener: Listener = mockAddListener.mock.calls[0][0]
    return { hook, listener }
  }

  it.each([
    {
      name: 'completed blob download of self',
      state: COMPLETED,
      item: generateDownloadItem({ url: BLOB_URL, byExtensionId: EXT_ID }),
      shouldRevoke: true,
    },
    {
      name: 'no state change',
      state: undefined,
      item: generateDownloadItem({ url: BLOB_URL, byExtensionId: EXT_ID }),
      shouldRevoke: false,
    },
    {
      name: 'download still in progress',
      state: { current: 'in_progress', previous: 'in_progress' },
      item: generateDownloadItem({ url: BLOB_URL, byExtensionId: EXT_ID }),
      shouldRevoke: false,
    },
    {
      name: 'download item not found',
      state: COMPLETED,
      item: undefined,
      shouldRevoke: false,
    },
    {
      name: 'download from other extension',
      state: COMPLETED,
      item: generateDownloadItem({ url: BLOB_URL, byExtensionId: 'OTHER' }),
      shouldRevoke: false,
    },
    {
      name: 'non-object url',
      state: COMPLETED,
      item: generateDownloadItem({
        url: 'https://x.com/file.json',
        byExtensionId: EXT_ID,
      }),
      shouldRevoke: false,
    },
  ])(
    'revoke=$shouldRevoke when $name',
    async ({ state, item, shouldRevoke }) => {
      const { listener } = setup(item)

      await listener({ id: 1, state })

      if (shouldRevoke) {
        expect(mockRevokeObjectURL).toHaveBeenCalledWith(BLOB_URL)
      } else {
        expect(mockRevokeObjectURL).not.toHaveBeenCalled()
      }
    }
  )

  it('removes the listener on unmount', () => {
    const { hook, listener } = setup(undefined)

    hook.unmount()

    expect(mockRemoveListener).toHaveBeenCalledWith(listener)
  })
})
