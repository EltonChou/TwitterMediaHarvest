/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { WebExtStorageProxy } from '#libs/webExtStorage/base'
import type { LocalStorageSchema } from '#libs/webExtStorage/local/schema'
import type { SyncStorageSchema } from '#libs/webExtStorage/sync/schema'
import type { Storage } from 'webextension-polyfill'
import Browser from 'webextension-polyfill'

export class LocalExtensionStorageProxy extends WebExtStorageProxy<LocalStorageSchema> {
  constructor(storageArea?: Storage.StorageArea) {
    super(storageArea || Browser.storage.local)
  }
}

export class SyncExtensionStorageProxy extends WebExtStorageProxy<SyncStorageSchema> {
  constructor(storageArea?: Storage.StorageArea) {
    super(storageArea || Browser.storage.sync)
  }
}
