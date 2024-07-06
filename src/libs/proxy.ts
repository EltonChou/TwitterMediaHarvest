import type {
  LocalStorageSchema as LocalSchema,
  SyncStorageSchema as SyncSchema,
} from '#schema'

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

export class InMemoryStorageProxy<T extends Partial<LocalSchema | SyncSchema>>
  implements IStorageProxy<T>
{
  constructor(protected storage: Record<string, any> = {}) {}

  async setItem(item: Partial<T>): Promise<void> {
    this.storage = { ...this.storage, ...item }
  }

  async getItemByKey<Key extends SchemaKey<T>>(key: Key): Promise<Pick<T, Key>> {
    const strKey = String(key)
    return Object.hasOwn(this.storage, strKey)
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
