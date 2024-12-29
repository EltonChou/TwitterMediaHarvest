import {
  LocalExtensionStorageProxy,
  SyncExtensionStorageProxy,
} from '#infra/storageProxy'

export const syncWebExtStorage = new SyncExtensionStorageProxy()
export const localWebExtStorage = new LocalExtensionStorageProxy()
