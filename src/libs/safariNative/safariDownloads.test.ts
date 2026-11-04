import { sendNativeMessage } from './nativeMessage'
import {
  KEY_PREFIX,
  download,
  resumePendingDownloads,
  search,
  toDownloadDeltas,
} from './safariDownloads'
import { storage } from 'webextension-polyfill'

jest.mock('./nativeMessage', () => ({
  ...jest.requireActual('./nativeMessage'),
  sendNativeMessage: jest.fn(),
}))

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

describe('background downloads in the app', () => {
  beforeEach(() => jest.useFakeTimers())
  afterEach(() => jest.useRealTimers())

  const tick = () => jest.advanceTimersByTimeAsync(1000)

  it('polls the app until a long download finishes', async () => {
    mockedSend
      .mockResolvedValueOnce({ ok: true, pending: true, token: 'tok' })
      .mockResolvedValueOnce({ ok: true, pending: true, bytesReceived: 5 })
      .mockResolvedValueOnce({ ok: true, path: '/d/v.mp4', fileSize: 9e8 })

    const id = await download({
      url: 'https://video.twimg.com/v.mp4',
      filename: 'v.mp4',
    })
    await tick()
    expect((await search({ id }))[0]).toMatchObject({
      state: 'in_progress',
      nativeToken: 'tok',
    })
    await tick()
    await tick()

    expect(mockedSend).toHaveBeenLastCalledWith({
      type: 'status',
      token: 'tok',
    })
    const [item] = await search({ id })
    expect(item).toMatchObject({ state: 'complete', filename: '/d/v.mp4' })
    expect(item).not.toHaveProperty('nativeToken')
  })

  it('fails a download the app keeps not recognising', async () => {
    mockedSend
      .mockResolvedValueOnce({ ok: true, pending: true, token: 'gone' })
      .mockResolvedValue({ ok: true, pending: true, unknown: true })

    const id = await download({ url: 'https://x.com/v.mp4', filename: 'v.mp4' })
    await jest.advanceTimersByTimeAsync(63_000)

    expect((await search({ id }))[0]).toMatchObject({ state: 'interrupted' })
  })

  it('resumes waiting on downloads after the worker restarts', async () => {
    store.set(KEY_PREFIX + 7, {
      id: 7,
      state: 'in_progress',
      nativeToken: 'tok7',
      startTime: new Date().toISOString(),
    })
    store.set(KEY_PREFIX + 8, {
      id: 8,
      state: 'in_progress',
      startTime: new Date(Date.now() - 3600_000).toISOString(),
    })
    mockedSend.mockResolvedValue({ ok: true, path: '/d/7.mp4', fileSize: 1 })

    const resumed = resumePendingDownloads()
    await tick()
    await resumed

    expect(store.get(KEY_PREFIX + 7)).toMatchObject({ state: 'complete' })
    expect(store.get(KEY_PREFIX + 8)).toMatchObject({ state: 'interrupted' })
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
