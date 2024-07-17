import { type OpenDBCallbacks, deleteDB, openDB } from 'idb'

export abstract class BaseIDB<Schema, Version extends number> {
  abstract readonly databaseName: string

  constructor(
    readonly version: Version,
    private callbacks: OpenDBCallbacks<Schema> = {}
  ) {}

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
