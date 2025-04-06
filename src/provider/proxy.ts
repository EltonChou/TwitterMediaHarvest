/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import {
  LocalExtensionStorageProxy,
  SyncExtensionStorageProxy,
} from '#infra/storageProxy'

export const syncWebExtStorage = new SyncExtensionStorageProxy()
export const localWebExtStorage = new LocalExtensionStorageProxy()
