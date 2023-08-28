import type {
  LocalStorageSchema as LocalSchema,
  SyncStorageSchema as SyncSchema,
} from '@schema'
import type { Storage } from 'webextension-polyfill'
import Browser from 'webextension-polyfill'

export type SchemaKey<T> = string extends T
  ? never
  : number extends T
  ? never
  : boolean extends T
  ? never
  : keyof T

export type SchemaValue<T> = string extends T
  ? never
  : number extends T
  ? never
  : boolean extends T
  ? never
  : T[SchemaKey<T>]

export interface IStorageProxy<SchemaT extends Record<string, any>> {
  getItemByKey<Key extends SchemaKey<SchemaT>>(key: Key): Promise<Pick<SchemaT, Key>>
  getItemByDefaults<Defaults extends Partial<SchemaT>>(
    defaults: Defaults
  ): Promise<Defaults>
  setItem(item: Partial<SchemaT>): Promise<void>
  removeItem<Key extends SchemaKey<SchemaT>>(keys: Key | Key[]): Promise<void>
}

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

  async getItemByKey<Key extends SchemaKey<T>>(key: Key): Promise<Pick<T, Key>> {
    const strKey = String(key)
    const record = await this.storageArea.get(strKey)
    return Object.keys(record).includes(strKey)
      ? (record as Pick<T, SchemaKey<T>>)
      : undefined
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

export class SimpleObjectStorageProxy<T extends LocalSchema | SyncSchema>
  implements IStorageProxy<T>
{
  constructor(protected storage: Record<string, any> = {}) {}

  async setItem(item: Partial<T>): Promise<void> {
    this.storage = { ...this.storage, ...item }
  }

  async getItemByKey<Key extends SchemaKey<T>>(key: Key): Promise<Pick<T, Key>> {
    const strKey = String(key)
    return Object.keys(this.storage).includes(strKey)
      ? ({ [key]: this.storage[strKey] } as Pick<T, SchemaKey<T>>)
      : undefined
  }

  async getItemByDefaults<Defaults extends Partial<T>>(
    defaults: Defaults
  ): Promise<Defaults> {
    return { ...defaults, ...this.storage }
  }

  async removeItem<Key extends SchemaKey<T>>(keys: Key | Key[]): Promise<void> {
    Array.isArray(keys)
      ? keys.forEach(key => delete this.storage[String(key)])
      : delete this.storage[String(keys)]
  }
}
