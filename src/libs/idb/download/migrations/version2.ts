/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import type { IDBMirgration } from '#libs/idb/base'
import type { DownloadDBSchema } from '../schema'

const migrate: IDBMirgration<DownloadDBSchema> = database => {
  const historyStore = database.createObjectStore('history', {
    keyPath: 'tweetId',
  })
  historyStore.createIndex('byUserName', ['displayName', 'screenName'])
  historyStore.createIndex('byTweetTime', 'tweetTime')
  historyStore.createIndex('byDownloadTime', 'downloadTime')
}

export default migrate
