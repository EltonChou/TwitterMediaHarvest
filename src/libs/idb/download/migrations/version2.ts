import type { IDBMirgration } from '#libs/idb/base'
import type { DownloadDBSchema } from '#schema'

const migrate: IDBMirgration<DownloadDBSchema> = database => {
  const historyStore = database.createObjectStore('history', { keyPath: 'tweetId' })
  historyStore.createIndex('byUserName', ['displayName', 'screenName'])
  historyStore.createIndex('byTweetTime', 'tweetTime')
  historyStore.createIndex('byDownloadTime', 'downloadTime')
}

export default migrate
