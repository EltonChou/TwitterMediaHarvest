import { sendNativeMessage } from './nativeMessage'
import {
  KEY_PREFIX,
  download,
  search,
  toDownloadDeltas,
} from './safariDownloads'
import { storage } from 'webextension-polyfill'

jest.mock('./nativeMessage')

// Overloads confuse jest.mocked, so use a plain mock.
const mockedSend = sendNativeMessage as unknown as jest.Mock

/** In-memory `storage.local` */
const store = new Map<string, unknown>()

beforeEach(() => {
  store.clear()
  jest.spyOn(storage.local, 'get').mockImplementation(async keys => {
    if (keys === null) return Object.fromEntries(store.entries())
    const key = keys as string
    return store.has(key) ? { [key]: store.get(key) } : {}
  })
  jest.spyOn(storage.local, 'set').mockImplementation(async items => {
    Object.entries(items).forEach(([k, v]) => store.set(k, v))
  })
  jest.spyOn(storage.local, 'remove').mockImplementation(async keys => {
    ;[keys].flat().forEach(k => store.delete(k))
  })
  global.fetch = jest.fn()
})

afterEach(() => jest.restoreAllMocks())

const flush = () => new Promise(resolve => setTimeout(resolve, 0))

describe('safariDownloads', () => {
  it('records the download and marks it complete when the app saves it', async () => {
    mockedSend.mockResolvedValue({
      ok: true,
      path: '/Users/me/Downloads/mh/a.jpg',
      fileSize: 42,
      mime: 'image/jpeg',
    })

    const id = await download({
      url: 'https://pbs.twimg.com/media/a.jpg',
      filename: 'mh/a.jpg',
      conflictAction: 'overwrite',
    })
    await flush()

    expect(mockedSend).toHaveBeenCalledWith({
      type: 'download',
      url: 'https://pbs.twimg.com/media/a.jpg',
      filename: 'mh/a.jpg',
      conflictAction: 'overwrite',
    })
    const [item] = await search({ id })
    expect(item).toMatchObject({
      id,
      state: 'complete',
      filename: '/Users/me/Downloads/mh/a.jpg',
      fileSize: 42,
      byExtensionId: 'TEST',
    })
  })

  it('marks the download interrupted when the app fails', async () => {
    mockedSend.mockResolvedValue({ ok: false, error: 'nope' })

    const id = await download({ url: 'https://x.com/a.mp4', filename: 'a.mp4' })
    await flush()

    const [item] = await search({ id })
    expect(item).toMatchObject({ state: 'interrupted', error: 'FILE_FAILED' })
  })

  it('sends blob URLs to the app as base64 data', async () => {
    mockedSend.mockResolvedValue({ ok: true, path: '/p', fileSize: 2 })
    jest.mocked(global.fetch).mockResolvedValue({
      blob: async () => new Blob(['hi'], { type: 'application/json' }),
    } as Response)

    await download({ url: 'blob:abc', filename: 'history.json' })
    await flush()
    await flush()

    expect(mockedSend).toHaveBeenCalledWith(
      expect.objectContaining({ data: btoa('hi'), mime: 'application/json' })
    )
  })

  it('lists newest downloads first and honours the limit', async () => {
    store.set(KEY_PREFIX + 1, { id: 1 })
    store.set(KEY_PREFIX + 3, { id: 3 })
    store.set(KEY_PREFIX + 2, { id: 2 })
    store.set('unrelated', { id: 9 })

    const items = await search({ limit: 2 })
    expect(items.map(i => i.id)).toEqual([3, 2])
  })
})

describe('toDownloadDeltas', () => {
  it('reports state changes of download records only', () => {
    const deltas = toDownloadDeltas({
      [KEY_PREFIX + 5]: {
        oldValue: { id: 5, state: 'in_progress', filename: 'a.jpg' },
        newValue: { id: 5, state: 'complete', filename: '/d/a.jpg' },
      },
      [KEY_PREFIX + 6]: {
        oldValue: { id: 6, state: 'in_progress' },
        newValue: { id: 6, state: 'in_progress' },
      },
      other: { newValue: { id: 7, state: 'complete' } },
    })

    expect(deltas).toEqual([
      {
        id: 5,
        state: { previous: 'in_progress', current: 'complete' },
        filename: { previous: 'a.jpg', current: '/d/a.jpg' },
      },
    ])
  })
})
