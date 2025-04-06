/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { deleteDB, openDB } from 'idb'
import type {
  DBSchema,
  IDBPTransaction,
  OpenDBCallbacks,
  StoreNames,
} from 'idb'

export type CompleteTx = () => Promise<void>
export type AbortTx = () => Promise<void>

export interface TransactionContext<Tx> {
  tx: Tx
  completeTx: CompleteTx
  abortTx: AbortTx
}

interface TransactionCallbacks {
  quotaExceeded?: () => Promise<void> | VoidFunction
}

export abstract class BaseIDB<Schema extends DBSchema, Version extends number> {
  abstract readonly databaseName: string

  readonly version: Version
  protected callbacks: OpenDBCallbacks<Schema>
  protected transactionCallbacks: TransactionCallbacks

  constructor(version: Version) {
    this.version = version
    this.callbacks = {}
    this.transactionCallbacks = {}
  }

  /** @see {@link OpenDBCallbacks} */
  onUpgrade(handler: OpenDBCallbacks<Schema>['upgrade']) {
    this.callbacks.upgrade = handler
    return this
  }

  /** @see {@link OpenDBCallbacks} */
  onBlocked(handler: OpenDBCallbacks<Schema>['blocked']) {
    this.callbacks.blocked = handler
    return this
  }

  /** @see {@link OpenDBCallbacks} */
  onBlocking(handler: OpenDBCallbacks<Schema>['blocking']) {
    this.callbacks.blocking = handler
    return this
  }

  /** @see {@link OpenDBCallbacks} */
  onTerminated(handler: OpenDBCallbacks<Schema>['terminated']) {
    this.callbacks.terminated = handler
    return this
  }

  onQuotaExceeded(handler: () => Promise<void> | VoidFunction) {
    this.transactionCallbacks.quotaExceeded = handler
  }

  async connect() {
    return await openDB<Schema>(this.databaseName, this.version, this.callbacks)
  }

  async delete() {
    return await deleteDB(this.databaseName)
  }

  prepareTransaction<
    Name extends StoreNames<Schema>,
    Mode extends IDBTransactionMode = 'readonly',
  >(
    storeNames: ArrayLike<Name>,
    mode: Mode,
    options?: IDBTransactionOptions
  ): Promise<TransactionContext<IDBPTransaction<Schema, ArrayLike<Name>, Mode>>>
  prepareTransaction<
    Name extends StoreNames<Schema>,
    Mode extends IDBTransactionMode = 'readonly',
  >(
    storeNames: Name,
    mode: Mode,
    options?: IDBTransactionOptions
  ): Promise<TransactionContext<IDBPTransaction<Schema, [Name], Mode>>>
  async prepareTransaction<Name extends StoreNames<Schema>>(
    storeNames: Name,
    mode: IDBTransactionMode = 'readonly',
    options?: IDBTransactionOptions
  ) {
    const client = await this.connect()
    const tx = client.transaction(storeNames, mode, options)

    /**
     * @see {@link https://web.dev/articles/storage-for-the-web#indexeddb}
     * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/IDBTransaction/error}
     **/
    const quotaExceededListener: ListenerOf<IDBTransaction> = async () => {
      if (tx.error?.name === 'QuotaExceededError') {
        const cb = this.transactionCallbacks?.quotaExceeded
        if (cb) await cb()
      }
    }

    tx.addEventListener('abort', quotaExceededListener)

    return Object.freeze({
      tx,
      completeTx: async () => {
        try {
          await tx.done
        } finally {
          client.close()
        }
      },
      abortTx: () =>
        new Promise<void>((resolve, reject) => {
          try {
            tx.abort()
            resolve()
          } catch (error) {
            reject(error)
          } finally {
            client.close()
          }
        }),
    })
  }
}

export const isSupportedIDB = () => {
  return (
    typeof window?.indexedDB !== 'undefined' || typeof indexedDB !== 'undefined'
  )
}

export type IDBMirgration<SchemaType> = OpenDBCallbacks<SchemaType>['upgrade']

export function* versionRange<Version extends number>(
  oldVersion: number,
  newVersion: number | null
) {
  if (newVersion !== null) {
    for (let i = oldVersion + 1; i <= newVersion; i++) {
      yield i as Version
    }
  } else {
    yield oldVersion as Version
  }
}
