/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
/**
 * A stand-in for the `downloads` API on Safari, which does not have one.
 *
 * Files are saved by the containing macOS app through native messaging.
 * Download records live in `storage.local`, one key per download, so every
 * extension context (service worker, popup, options page) sees the same
 * records and gets `onChanged` events from `storage.onChanged`.
 */
import type { NativeDownloadResponse } from './nativeMessage'
import { isPending, sendNativeMessage } from './nativeMessage'
import type { Downloads, Storage } from 'webextension-polyfill'
import { runtime, storage } from 'webextension-polyfill'

export const KEY_PREFIX = 'safari.download:'
const MAX_RECORDS = 500
const POLL_INTERVAL_MS = 1000
/** How long the app may not recognise a token before the download is failed. */
const UNKNOWN_TOKEN_GRACE_MS = 60_000

/** A download record, plus the app's token while it downloads in the background. */
type SafariDownloadItem = Downloads.DownloadItem & { nativeToken?: string }

type DownloadListener = (delta: Downloads.OnChangedDownloadDeltaType) => void

const toKey = (id: number) => KEY_PREFIX + id

/**
 * Casts go through this helper: the i18n ts-loader transformer leaves `as`
 * casts that sit inside call chains in the emitted JS, and babel then fails
 * to parse it.
 */
const asItem = (value: unknown): SafariDownloadItem | undefined =>
  value as SafariDownloadItem | undefined

let lastId = 0
/** Unique and increasing, also across service worker restarts. */
const nextId = (): number => {
  // The random part keeps ids from different contexts apart.
  lastId = Math.max(
    lastId + 1,
    Date.now() * 1000 + Math.floor(Math.random() * 1000)
  )
  return lastId
}

const isLocalUrl = (url: string) =>
  url.startsWith('blob:') || url.startsWith('data:')

const blobToBase64 = async (blob: Blob): Promise<string> => {
  const bytes = new Uint8Array(await blob.arrayBuffer())
  let binary = ''
  const chunk = 0x8000
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk))
  }
  return btoa(binary)
}

const makeItem = (
  id: number,
  options: Downloads.DownloadOptionsType
): Downloads.DownloadItem => ({
  id,
  url: options.url,
  filename: options.filename ?? '',
  incognito: false,
  danger: 'safe',
  mime: '',
  startTime: new Date().toISOString(),
  state: 'in_progress',
  paused: false,
  canResume: false,
  bytesReceived: 0,
  totalBytes: -1,
  fileSize: -1,
  exists: false,
  byExtensionId: runtime.id,
})

const readItem = async (
  id: number
): Promise<SafariDownloadItem | undefined> => {
  const key = toKey(id)
  const record = await storage.local.get(key)
  return asItem(record[key])
}

const writeItem = (item: SafariDownloadItem) =>
  storage.local.set({ [toKey(item.id)]: item })

const readAllItems = async (): Promise<SafariDownloadItem[]> => {
  const records = await storage.local.get(null)
  const items: SafariDownloadItem[] = []
  for (const [key, value] of Object.entries(records)) {
    const item = asItem(value)
    if (key.startsWith(KEY_PREFIX) && item) items.push(item)
  }
  return items.sort((a, b) => b.id - a.id)
}

const pruneOldItems = async () => {
  const items = await readAllItems()
  const stale = items.slice(MAX_RECORDS).map(item => toKey(item.id))
  if (stale.length) await storage.local.remove(stale)
}

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

const finish = async (
  item: SafariDownloadItem,
  response: Exclude<NativeDownloadResponse, { pending: true }>
) => {
  const { nativeToken: _token, ...rest } = item
  const endTime = new Date().toISOString()
  await writeItem(
    response.ok
      ? {
          ...rest,
          state: 'complete',
          filename: response.path,
          fileSize: response.fileSize,
          totalBytes: response.fileSize,
          bytesReceived: response.fileSize,
          mime: response.mime ?? item.mime,
          exists: true,
          endTime,
        }
      : { ...rest, state: 'interrupted', error: 'FILE_FAILED', endTime }
  )
}

/** Downloads this context is already waiting on, so none is polled twice. */
const polling = new Set<number>()

/**
 * Waits for a background download in the app to finish. Polling stops if
 * Safari suspends the service worker; `resumePendingDownloads` picks it up
 * again when the worker starts.
 */
const waitForApp = async (item: SafariDownloadItem) => {
  const token = item.nativeToken
  if (!token || polling.has(item.id)) return
  polling.add(item.id)
  try {
    let unknownSince: number | undefined
    for (;;) {
      await sleep(POLL_INTERVAL_MS)
      const response = await sendNativeMessage({ type: 'status', token })
      if (!isPending(response)) return await finish(item, response)
      if (!response.unknown) {
        unknownSince = undefined
        continue
      }
      unknownSince ??= Date.now()
      if (Date.now() - unknownSince > UNKNOWN_TOKEN_GRACE_MS)
        return await finish(item, { ok: false, error: 'Download was lost.' })
    }
  } finally {
    polling.delete(item.id)
  }
}

const saveWithApp = async (
  item: SafariDownloadItem,
  options: Downloads.DownloadOptionsType
) => {
  const conflictAction = options.conflictAction ?? 'uniquify'
  const request = isLocalUrl(options.url)
    ? await fetch(options.url)
        .then(res => res.blob())
        .then(async blob => ({
          data: await blobToBase64(blob),
          mime: blob.type,
        }))
    : { url: options.url }

  const response = await sendNativeMessage({
    type: 'download',
    filename: item.filename,
    conflictAction,
    ...request,
  })

  if (!isPending(response)) return finish(item, response)
  if (!response.token)
    return finish(item, { ok: false, error: 'No download token.' })

  const pending = { ...item, nativeToken: response.token }
  await writeItem(pending)
  await waitForApp(pending)
}

const STALE_WITHOUT_TOKEN_MS = 10 * 60_000

/**
 * Resumes waiting on downloads the app was still running, and fails ones
 * that never reached the app (the worker stopped before it answered).
 */
export const resumePendingDownloads = async () => {
  const items = await readAllItems()
  const now = Date.now()
  await Promise.all(
    items
      .filter(item => item.state === 'in_progress')
      .map(item => {
        if (item.nativeToken) return waitForApp(item)
        if (now - Date.parse(item.startTime) > STALE_WITHOUT_TOKEN_MS)
          return finish(item, { ok: false, error: 'Download was lost.' })
      })
  )
}

export const download = async (
  options: Downloads.DownloadOptionsType
): Promise<number> => {
  const id = nextId()
  const item = makeItem(id, options)
  await writeItem(item)
  // Resolve with the id straight away, like `downloads.download` does.
  // Completion is reported through `onChanged`.
  void saveWithApp(item, options).catch(() =>
    writeItem({ ...item, state: 'interrupted', error: 'FILE_FAILED' })
  )
  void pruneOldItems()
  return id
}

export const search = async (
  query: Downloads.DownloadQuery
): Promise<Downloads.DownloadItem[]> => {
  if (query.id !== undefined) {
    const item = await readItem(query.id)
    return item ? [item] : []
  }
  const items = await readAllItems()
  return query.limit ? items.slice(0, query.limit) : items
}

export const erase = async (query: Downloads.DownloadQuery) => {
  const items = await search(query)
  await storage.local.remove(items.map(item => toKey(item.id)))
  return items.map(item => item.id)
}

export const removeFile = async (id: number) => {
  const item = await readItem(id)
  if (!item?.exists) return
  const response = await sendNativeMessage({
    type: 'removeFile',
    path: item.filename,
  })
  if (!response.ok) throw new Error(response.error)
  await writeItem({ ...item, exists: false })
}

/** Turns changes of stored records into `downloads.onChanged`-style deltas. */
export const toDownloadDeltas = (
  changes: Record<string, Storage.StorageChange>
): Downloads.OnChangedDownloadDeltaType[] =>
  Object.entries(changes)
    .filter(([key]) => key.startsWith(KEY_PREFIX))
    .flatMap(([_key, change]) => {
      const before = asItem(change.oldValue)
      const after = asItem(change.newValue)
      if (!after || before?.state === after.state) return []
      return [
        {
          id: after.id,
          state: { previous: before?.state, current: after.state },
          ...(after.error
            ? { error: { previous: before?.error, current: after.error } }
            : {}),
          ...(after.filename !== before?.filename
            ? {
                filename: {
                  previous: before?.filename,
                  current: after.filename,
                },
              }
            : {}),
        },
      ]
    })

const listeners = new Map<
  DownloadListener,
  (changes: Record<string, Storage.StorageChange>, area: string) => void
>()

export const onChanged = {
  addListener(listener: DownloadListener) {
    if (listeners.has(listener)) return
    const relay = (
      changes: Record<string, Storage.StorageChange>,
      area: string
    ) => {
      if (area !== 'local') return
      toDownloadDeltas(changes).forEach(delta => listener(delta))
    }
    listeners.set(listener, relay)
    storage.onChanged.addListener(relay)
  },
  removeListener(listener: DownloadListener) {
    const relay = listeners.get(listener)
    if (!relay) return
    storage.onChanged.removeListener(relay)
    listeners.delete(listener)
  },
  hasListener(listener: DownloadListener) {
    return listeners.has(listener)
  },
  hasListeners() {
    return listeners.size > 0
  },
}
