import { DownloadDBSchema } from '@schema'
import type { OpenDBCallbacks } from 'idb'
import { openDB } from 'idb'

abstract class BaseDB<SchemaType> {
  abstract databaseName: string

  constructor(readonly version: number, private callbacks: OpenDBCallbacks<SchemaType> = {}) {}

  get isSupported(): boolean {
    return (
      (typeof window !== 'undefined' && typeof window.indexedDB !== 'undefined') || typeof indexedDB !== 'undefined'
    )
  }

  onUpgrade(handler: OpenDBCallbacks<SchemaType>['upgrade']) {
    this.callbacks.upgrade = handler
    return this
  }

  onBlocked(handler: OpenDBCallbacks<SchemaType>['blocked']) {
    this.callbacks.blocked = handler
    return this
  }

  onBlocking(handler: OpenDBCallbacks<SchemaType>['blocking']) {
    this.callbacks.blocking = handler
    return this
  }

  onTerminated(handler: OpenDBCallbacks<SchemaType>['terminated']) {
    this.callbacks.terminated = handler
    return this
  }

  async connect() {
    return await openDB<SchemaType>(this.databaseName, this.version, this.callbacks)
  }
}

class DownloadDB extends BaseDB<DownloadDBSchema> {
  databaseName = 'download'
}

export const downloadDB = new DownloadDB(1).onUpgrade((database, oldVersion, newVersion, transaction, event) => {
  console.log('Upgrading IndexedDB', '(' + database.name + ')', 'from', oldVersion, 'to', newVersion)

  if (newVersion === 1) {
    database.createObjectStore('record', { keyPath: 'id' })
  }
})
