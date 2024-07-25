import { deleteDB, openDB } from 'idb'
import type { DBSchema, IDBPTransaction, OpenDBCallbacks, StoreNames } from 'idb'

interface TransactionContext<Tx> {
  tx: Tx
  completeTx: () => void
  abortTx: () => void
}

export abstract class BaseIDB<Schema extends DBSchema, Version extends number> {
  abstract readonly databaseName: string

  readonly version: Version
  protected callbacks: OpenDBCallbacks<Schema>

  constructor(version: Version) {
    this.version = version
    this.callbacks = {}
  }

  onUpgrade(handler: OpenDBCallbacks<Schema>['upgrade']) {
    this.callbacks.upgrade = handler
    return this
  }

  onBlocked(handler: OpenDBCallbacks<Schema>['blocked']) {
    this.callbacks.blocked = handler
    return this
  }

  onBlocking(handler: OpenDBCallbacks<Schema>['blocking']) {
    this.callbacks.blocking = handler
    return this
  }

  onTerminated(handler: OpenDBCallbacks<Schema>['terminated']) {
    this.callbacks.terminated = handler
    return this
  }

  async connect() {
    return await openDB<Schema>(this.databaseName, this.version, this.callbacks)
  }

  async delete() {
    return await deleteDB(this.databaseName)
  }

  prepareTransaction<
    Name extends StoreNames<Schema>,
    Mode extends IDBTransactionMode = 'readonly'
  >(
    storeNames: ArrayLike<Name>,
    mode: Mode,
    options?: IDBTransactionOptions
  ): Promise<TransactionContext<IDBPTransaction<Schema, ArrayLike<Name>, Mode>>>
  prepareTransaction<
    Name extends StoreNames<Schema>,
    Mode extends IDBTransactionMode = 'readonly'
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

    return {
      tx,
      completeTx: () => {
        tx.commit()
        client.close()
      },
      abortTx: () => {
        tx.abort()
        client.close()
      },
    }
  }
}

export const isSupportedIDB = () => {
  return typeof window?.indexedDB !== 'undefined' || typeof indexedDB !== 'undefined'
}

export type IDBMirgration<SchemaType> = OpenDBCallbacks<SchemaType>['upgrade']

export function* versionRange<Version>(oldVersion: number, newVersion: number | null) {
  if (newVersion !== null) {
    for (let i = oldVersion + 1; i <= newVersion; i++) {
      yield i as Version
    }
  } else {
    yield oldVersion as Version
  }
}
