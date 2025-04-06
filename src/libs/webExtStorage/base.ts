/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import type { IStorageProxy, SchemaKey } from '#libs/storageProxy'
import type { Storage } from 'webextension-polyfill'

export abstract class WebExtStorageProxy<Schema>
  implements IStorageProxy<Schema>
{
  constructor(readonly storage: Storage.StorageArea) {}

  async getItemByKey<Key extends SchemaKey<Schema>>(
    key: Key
  ): Promise<Pick<Schema, Key> | undefined> {
    const strKey = String(key)
    const record = await this.storage.get(strKey)
    return Object.keys(record).includes(strKey)
      ? (record as Pick<Schema, Key>)
      : undefined
  }

  async getItemByDefaults<Defaults extends Partial<Schema>>(
    defaults: Defaults
  ): Promise<Defaults> {
    const record = await this.storage.get(defaults)
    return { ...defaults, ...record }
  }

  async setItem(item: Partial<Schema>): Promise<void> {
    await this.storage.set(item)
  }

  async removeItem<Key extends SchemaKey<Schema>>(
    keys: Key | Key[]
  ): Promise<void> {
    await this.storage.remove(
      Array.isArray(keys) ? [...keys].map(v => String(v)) : String(keys)
    )
  }
}
