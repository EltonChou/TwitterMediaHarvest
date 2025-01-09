import type { IStorageProxy } from '#libs/storageProxy'
import type { SchemaKey } from '#libs/storageProxy'
import type { LocalStorageSchema } from '#libs/webExtStorage/local/schema'
import type { SyncStorageSchema } from '#libs/webExtStorage/sync/schema'

export class InMemoryStorageProxy<
  T extends Partial<LocalStorageSchema | SyncStorageSchema>,
> implements IStorageProxy<T>
{
  constructor(protected storage: Record<string, unknown> = {}) {}

  async setItem(item: Partial<T>): Promise<void> {
    this.storage = { ...this.storage, ...item }
  }

  async getItemByKey<Key extends SchemaKey<T>>(
    key: Key
  ): Promise<Pick<T, Key> | undefined> {
    const strKey = String(key)
    return Object.hasOwn(this.storage, strKey)
      ? ({ [key]: this.storage[strKey] } as Pick<T, Key>)
      : undefined
  }

  async getItemByDefaults<Defaults extends Partial<T>>(
    defaults: Defaults
  ): Promise<Defaults> {
    return { ...defaults, ...this.storage }
  }

  async removeItem<Key extends SchemaKey<T>>(keys: Key | Key[]): Promise<void> {
    if (Array.isArray(keys)) {
      keys.forEach(key => delete this.storage[String(key)])
    } else {
      delete this.storage[String(keys)]
    }
  }
}
