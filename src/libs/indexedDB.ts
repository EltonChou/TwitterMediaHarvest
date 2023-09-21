import { DownloadDBSchema } from '@schema'
import { type OpenDBCallbacks, deleteDB, openDB } from 'idb'

abstract class BaseDB<SchemaType, VersionT extends number> {
  abstract databaseName: string

  constructor(
    readonly version: VersionT,
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

type DownloadDBVersion = 1 | 2

class DownloadDB extends BaseDB<DownloadDBSchema, DownloadDBVersion> {
  databaseName = 'download'
}

export function* versionToRun(oldVersion: number, newVersion: number) {
  for (let i = oldVersion + 1; i <= newVersion; i++) {
    yield i
  }
}

function migrationToRun(oldVersion: number, newVersion: number) {
  return function* <VersionT extends number>(migrations: Migration<VersionT>) {
    for (const version of versionToRun(oldVersion, newVersion)) {
      if (version in migrations) yield migrations[version as VersionT]
    }
  }
}

type Migration<VersionT extends number> = {
  [k in VersionT]: () => void
}

export const downloadDB = new DownloadDB(2).onUpgrade(
  (database, oldVersion, newVersion, transaction, event) => {
    const downloadDbMigration: Migration<DownloadDBVersion> = {
      1: () => {
        database.createObjectStore('record', { keyPath: 'id' })
      },
      2: () => {
        const historyStore = database.createObjectStore('history', { keyPath: 'tweetId' })
        historyStore.createIndex('byUserName', ['displayName', 'screenName'])
        historyStore.createIndex('byTweetTime', 'tweetTime')
        historyStore.createIndex('byDownloadTime', 'downloadTime')
      },
    }

    for (const migrate of migrationToRun(oldVersion, newVersion)(downloadDbMigration)) {
      migrate()
    }
  }
)
