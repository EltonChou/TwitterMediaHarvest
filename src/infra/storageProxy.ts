import type { IStorageProxy, SchemaKey } from '#libs/proxy'
import type {
  LocalStorageSchema as LocalSchema,
  SyncStorageSchema as SyncSchema,
} from '#schema'
import type { Storage } from 'webextension-polyfill'
import Browser from 'webextension-polyfill'

// eslint-disable-next-line max-len, prettier/prettier
abstract class ExtensionStorageProxy<T extends LocalSchema | SyncSchema>
  implements IStorageProxy<T>
{
  constructor(readonly storageArea: Storage.StorageArea) {}

  async setItem(item: Partial<T>): Promise<void> {
    await this.storageArea.set(item)
  }

  async removeItem<Key extends SchemaKey<T>>(keys: Key | Key[]): Promise<void> {
    await this.storageArea.remove(
      Array.isArray(keys) ? [...keys].map(v => String(v)) : String(keys)
    )
  }

  async getItemByKey<Key extends SchemaKey<T>>(
    key: Key
  ): Promise<Pick<T, Key> | undefined> {
    const strKey = String(key)
    const record = await this.storageArea.get(strKey)
    return Object.hasOwn(record, strKey) ? (record as Pick<T, Key>) : undefined
  }

  async getItemByDefaults<Defaults extends Partial<T>>(
    defaults: Defaults
  ): Promise<Defaults> {
    const record = await this.storageArea.get(defaults)
    return { ...defaults, ...record }
  }
}

export class LocalExtensionStorageProxy extends ExtensionStorageProxy<LocalSchema> {
  constructor(storageArea?: Storage.StorageArea) {
    super(storageArea || Browser.storage.local)
  }
}

export class SyncExtensionStorageProxy extends ExtensionStorageProxy<SyncSchema> {
  constructor(storageArea?: Storage.StorageArea) {
    super(storageArea || Browser.storage.sync)
  }
}
