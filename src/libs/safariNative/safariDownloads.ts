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
import { sendNativeMessage } from './nativeMessage'
import type { Downloads, Storage } from 'webextension-polyfill'
import { runtime, storage } from 'webextension-polyfill'

export const KEY_PREFIX = 'safari.download:'
const MAX_RECORDS = 500

type DownloadListener = (delta: Downloads.OnChangedDownloadDeltaType) => void

const toKey = (id: number) => KEY_PREFIX + id

/**
 * Casts go through this helper: the i18n ts-loader transformer leaves `as`
 * casts that sit inside call chains in the emitted JS, and babel then fails
 * to parse it.
 */
const asItem = (value: unknown): Downloads.DownloadItem | undefined =>
  value as Downloads.DownloadItem | undefined

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
): Promise<Downloads.DownloadItem | undefined> => {
  const key = toKey(id)
  const record = await storage.local.get(key)
  return record[key] as Downloads.DownloadItem | undefined
}

const writeItem = (item: Downloads.DownloadItem) =>
  storage.local.set({ [toKey(item.id)]: item })

const readAllItems = async (): Promise<Downloads.DownloadItem[]> => {
  const records = await storage.local.get(null)
  const items: Downloads.DownloadItem[] = []
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

const saveWithApp = async (
  item: Downloads.DownloadItem,
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

  const finished: Downloads.DownloadItem = response.ok
    ? {
        ...item,
        state: 'complete',
        filename: response.path,
        fileSize: response.fileSize,
        totalBytes: response.fileSize,
        bytesReceived: response.fileSize,
        mime: response.mime ?? item.mime,
        exists: true,
        endTime: new Date().toISOString(),
      }
    : {
        ...item,
        state: 'interrupted',
        error: 'FILE_FAILED',
        endTime: new Date().toISOString(),
      }

  await writeItem(finished)
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
