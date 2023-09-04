import { DownloadDBSchema } from '@schema'
import type { OpenDBCallbacks } from 'idb'
import { deleteDB, openDB } from 'idb'

abstract class BaseDB<SchemaType> {
  abstract databaseName: string

  constructor(
    readonly version: number,
    private callbacks: OpenDBCallbacks<SchemaType> = {}
  ) {}

  get isSupported(): boolean {
    return (
      (typeof window !== 'undefined' && typeof window.indexedDB !== 'undefined') ||
      typeof indexedDB !== 'undefined'
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

  async delete() {
    return await deleteDB(this.databaseName)
  }
}

class DownloadDB extends BaseDB<DownloadDBSchema> {
  databaseName = 'download'
}

export const downloadDB = new DownloadDB(2).onUpgrade(
  (database, oldVersion, newVersion, transaction, event) => {
    if (newVersion === 1) {
      database.createObjectStore('record', { keyPath: 'id' })
    }

    if (newVersion === 2) {
      if (oldVersion !== 1) database.createObjectStore('record', { keyPath: 'id' })
      const historyStore = database.createObjectStore('history', { keyPath: 'tweetId' })
      historyStore.createIndex('byUserName', ['displayName', 'screenName'])
      historyStore.createIndex('byTweetTime', 'tweetTime')
      historyStore.createIndex('byDownloadTime', 'downloadTime')
    }
  }
)
