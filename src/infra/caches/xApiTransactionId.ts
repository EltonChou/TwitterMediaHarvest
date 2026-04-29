/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import type {
  IXTransactionIdCache,
  TransactionIdKey,
} from '#domain/repositories/xTransactionId'
import { XTransactionId } from '#domain/valueObjects/xTransactionId'
import { RequestTransactionIdMessage } from '#libs/webExtMessage/messages/requestTransactionId'
import { toErrorResult, toSuccessResult } from '#utils/result'
import type { Runtime } from 'webextension-polyfill'

type StoreKey = string
type Resolver = (item: XTransactionId) => void

export type MessagePortProvider = () => Runtime.Port | undefined

type CacheOptions = {
  /**
   * Milliseconds to wait for a transaction id before `get` errors.
   * @default 1000
   */
  timeout?: number
  /**
   * Maximum transaction ids stored per key. When exceeded, the oldest
   * entry is dropped (FIFO).
   * @default 5
   */
  maxPerKey?: number
}

const DEFAULT_TIMEOUT = 1000
const DEFAULT_MAX_PER_KEY = 5

const toStoreKey = (method: string, path: string): StoreKey =>
  `${method} ${path}`

/**
 * In-memory cache for {@link XTransactionId} values, keyed by `[path, method]`.
 *
 * `get` pulls a stored id when one is available; otherwise it posts a
 * {@link RequestTransactionIdMessage} through the given port and waits for an
 * external producer to call `save` with the resulting id. A timeout bounds
 * the wait.
 *
 * The cache does not listen on the port itself — the port's message handler
 * (installed at the extension entry level) is responsible for parsing responses
 * and calling `save`.
 */
export class XTransactionIdCache implements IXTransactionIdCache {
  readonly getPort: MessagePortProvider
  protected store: Map<StoreKey, XTransactionId[]>
  protected pending: Map<StoreKey, Resolver[]>
  protected timeout: number
  protected maxPerKey: number

  /**
   * @param getPort Resolver for the port used to request transaction ids.
   *   Invoked lazily on each `get` call so the cache can share a port with
   *   a connection pool that changes over time (ports come and go as tabs
   *   open/close).
   * @param options See {@link CacheOptions}.
   */
  constructor(getPort: MessagePortProvider, options?: CacheOptions) {
    this.getPort = getPort
    this.timeout = options?.timeout ?? DEFAULT_TIMEOUT
    this.maxPerKey = options?.maxPerKey ?? DEFAULT_MAX_PER_KEY
    this.store = new Map()
    this.pending = new Map()
  }

  async get(
    cacheId: TransactionIdKey
  ): AsyncResult<XTransactionId | undefined, Error> {
    const [path, method] = cacheId
    const key = toStoreKey(method, path)

    const stored = this.store.get(key)
    if (stored && stored.length > 0) return toSuccessResult(stored.shift())

    const port = this.getPort()
    if (!port) return toErrorResult(new Error('No message port available'))

    port.postMessage(new RequestTransactionIdMessage({ path, method }).toJSON())

    try {
      const item = await this.waitForItem(key)
      return toSuccessResult(item)
    } catch (error) {
      return toErrorResult(error as Error)
    }
  }

  async save(item: XTransactionId): Promise<UnsafeTask> {
    const { method, path } = item.mapBy(props => props)
    const key = toStoreKey(method, path)

    const waiters = this.pending.get(key)
    if (waiters && waiters.length > 0) {
      const resolve = waiters.shift()!
      resolve(item)
      return
    }

    const bucket = this.store.get(key) ?? []
    bucket.push(item)
    if (bucket.length > this.maxPerKey) bucket.shift()
    this.store.set(key, bucket)
  }

  async saveAll(...items: XTransactionId[]): Promise<UnsafeTask> {
    if (items.length === 0) return
    const errors = await Promise.all(items.map(item => this.save(item)))
    if (errors.some(error => error))
      return new Error('Failed to cache some transaction ids', {
        cause: errors,
      })
  }

  private waitForItem(key: StoreKey): Promise<XTransactionId> {
    return new Promise((resolve, reject) => {
      const waiters = this.pending.get(key) ?? []
      const timer = setTimeout(() => {
        this.removeWaiter(key, onResolve)
        reject(new Error('Timed out waiting for transaction id'))
      }, this.timeout)

      const onResolve: Resolver = item => {
        clearTimeout(timer)
        resolve(item)
      }

      waiters.push(onResolve)
      this.pending.set(key, waiters)
    })
  }

  private removeWaiter(key: StoreKey, resolver: Resolver): void {
    const waiters = this.pending.get(key)
    if (!waiters) return
    const index = waiters.indexOf(resolver)
    if (index >= 0) waiters.splice(index, 1)
  }
}
