import { DownloadRecord, TweetDownloadHistoryItem } from './models'
import type { DownloadDBSchema } from '@schema'
import { type IDBPDatabase } from 'idb'
import type { Storage } from 'webextension-polyfill'

export interface IDownloadRecordsRepository {
  getById(downloadItemId: number): Promise<DownloadRecord | null>
  save(downloadRecord: DownloadRecord): Promise<void>
  removeById(downloadItemId: number): Promise<void>
}

abstract class IndexedDBRepository {
  constructor(readonly clientProvider: Provider<IDBPDatabase<DownloadDBSchema>>) {}
}

export class IndexedDBDownloadRecordsRepository
  extends IndexedDBRepository
  implements IDownloadRecordsRepository
{
  async save(downloadRecord: DownloadRecord): Promise<void> {
    const client = await this.clientProvider()
    await client.put('record', downloadRecord.toJson())
  }

  async getById(downloadItemId: number): Promise<DownloadRecord | null> {
    const client = await this.clientProvider()
    const record = await client.get('record', downloadItemId)
    return record ? DownloadRecord.fromJson(record) : null
  }

  async removeById(downloadItemId: number): Promise<void> {
    const client = await this.clientProvider()
    await client.delete('record', downloadItemId)
  }
}

type DownloadRecordId = `dl_${number}`

export class StorageAreaDownloadRecordsRepository implements IDownloadRecordsRepository {
  constructor(readonly storageArea: Storage.StorageArea) {}

  async save(downloadRecord: DownloadRecord): Promise<void> {
    await this.storageArea.set({
      [createId(downloadRecord.id)]: downloadRecord.toJson(),
    })
  }

  async getById(downloadItemId: number): Promise<DownloadRecord | null> {
    const recordId = createId(downloadItemId)
    const volume = await this.storageArea.get(recordId)
    if (recordId in volume) {
      return DownloadRecord.fromJson(volume[recordId])
    }
    return null
  }

  async removeById(downloadItemId: number): Promise<void> {
    const recordId = createId(downloadItemId)
    await this.storageArea.remove(recordId)
  }
}

function createId(downloadItemId: number): DownloadRecordId {
  return `dl_${downloadItemId}`
}

export interface IDownloadHistoryRepository {
  save(item: TweetDownloadHistoryItem): Promise<void>
  clear(): Promise<void>
  tweetHasDownloaded(tweetId: string): Promise<boolean>
  getAll(): Promise<TweetDownloadHistoryItem[]>
  getLatest(limit?: number): Promise<TweetDownloadHistoryItem[]>
  getByTweetId(tweetId: string): Promise<TweetDownloadHistoryItem | undefined>
  searchByUserName(userName: string, limit?: number): Promise<TweetDownloadHistoryItem[]>
  searchByTweetTime(
    timeRange: IDBKeyRange,
    limit?: number
  ): Promise<TweetDownloadHistoryItem[]>
  searchByDownloadTime(
    timeRange: IDBKeyRange,
    limit?: number
  ): Promise<TweetDownloadHistoryItem[]>
}

export class IndexedDBDownloadHistoryRepository
  extends IndexedDBRepository
  implements IDownloadHistoryRepository
{
  private openCursor(
    range?: IDBKeyRange,
    direction?: IDBCursorDirection,
    limit: number | 'inf' = 50
  ) {
    const transaction = this.transaction()
    const shouldContinue = (count: number) => (limit === 'inf' ? true : count < limit)

    return async function* (indexKey: keyof DownloadDBSchema['history']['indexes']) {
      let cursor = await (await transaction).index(indexKey).openCursor(range, direction)

      let count = 0
      while (cursor && shouldContinue(count)) {
        yield cursor.value
        cursor = await cursor.continue()
        count += 1
      }
    }
  }

  async transaction(mode: IDBTransactionMode = 'readonly') {
    const client = await this.clientProvider()
    const tx = client.transaction('history', mode)
    return tx.store
  }

  async tweetHasDownloaded(tweetId: string): Promise<boolean> {
    const client = await this.clientProvider()
    const key = await client.getKey('history', tweetId)
    return Boolean(key)
  }

  async clear(): Promise<void> {
    const client = await this.clientProvider()
    await client.clear('history')
  }

  async save(item: TweetDownloadHistoryItem): Promise<void> {
    const client = await this.clientProvider()
    await client.put('history', item.toJson())
  }

  async getAll(): Promise<TweetDownloadHistoryItem[]> {
    const client = await this.clientProvider()
    const items = await client.getAll('history')
    return items.map(TweetDownloadHistoryItem.build)
  }

  async getLatest(limit = 10): Promise<TweetDownloadHistoryItem[]> {
    const collection = this.openCursor(null, 'prev', limit)('byDownloadTime')
    return (await asyncGeneratorToArray(collection)).map(TweetDownloadHistoryItem.build)
  }

  async getByTweetId(tweetId: string): Promise<TweetDownloadHistoryItem | undefined> {
    const client = await this.clientProvider()
    const item = await client.get('history', tweetId)
    return item ? TweetDownloadHistoryItem.build(item) : undefined
  }

  async searchByDownloadTime(
    timeRange: IDBKeyRange,
    limit = 50
  ): Promise<TweetDownloadHistoryItem[]> {
    const collection = this.openCursor(timeRange, 'prev', limit)('byDownloadTime')
    return (await asyncGeneratorToArray(collection)).map(TweetDownloadHistoryItem.build)
  }

  async searchByTweetTime(
    timeRange: IDBKeyRange,
    limit = 50
  ): Promise<TweetDownloadHistoryItem[]> {
    const collection = this.openCursor(timeRange, 'prev', limit)('byTweetTime')
    return (await asyncGeneratorToArray(collection)).map(TweetDownloadHistoryItem.build)
  }

  async searchByUserName(
    userName: string,
    limit = 10
  ): Promise<TweetDownloadHistoryItem[]> {
    const client = await this.clientProvider()
    const items = await client.getAll('history')
    const lowerCaseName = userName.toLowerCase()
    return items
      .filter(
        item =>
          item.displayName.toLowerCase().includes(lowerCaseName) ||
          item.screenName.toLowerCase().includes(lowerCaseName)
      )
      .map(TweetDownloadHistoryItem.build)
      .splice(0, limit)
  }
}

const asyncGeneratorToArray = async <T>(
  generator: AsyncGenerator<T, void, unknown>
): Promise<T[]> => {
  const result: T[] = []
  for await (const v of generator) result.push(v)
  return result
}
