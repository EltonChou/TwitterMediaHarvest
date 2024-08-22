import { DownloadHistory } from '#domain/entities/downloadHistory'
import { Factory } from '#domain/factories/base'
import type { IPortableDownloadHistoryRepository } from '#domain/repositories/portableDownloadHistory'
import { V5PortableHistory } from '#domain/valueObjects/portableDownloadHistory'
import { V5PortableDownloadHistoryItem } from '#domain/valueObjects/portableDownloadHistoryItem'
import { DownloadIDB } from '#libs/idb/download/db'
import { DownloadHistoryItem } from '#libs/idb/download/schema'
import { toErrorResult, toSuccessResult } from '#utils/result'
import { downloadHistoryToIDBItem } from '../../mappers/downloadHistory'
import { toError } from 'fp-ts/lib/Either'

export class IDBPortableDownloadHistoryRepository
  implements IPortableDownloadHistoryRepository
{
  constructor(
    readonly downloadIDB: DownloadIDB,
    readonly blobToUrl: (blob: Blob) => Promise<string>
  ) {}

  async export(): AsyncResult<string> {
    try {
      const { tx } = await this.downloadIDB.prepareTransaction('history', 'readonly')

      const items = await tx.objectStore('history').getAll()

      const protableDownloadHistory = new V5PortableHistory({
        items: items.map(downloadHistoryDBItemToProtableHistoryItem),
      })

      const blob = new Blob([JSON.stringify(protableDownloadHistory)], {
        type: 'application/json',
      })

      const fileUrl = await this.blobToUrl(blob)

      return toSuccessResult(fileUrl)
    } catch (error) {
      return toErrorResult(toError(error))
    }
  }

  async import(downloadHistories: DownloadHistory[]): Promise<UnsafeTask> {
    let context
    try {
      context = await this.downloadIDB.prepareTransaction(
        ['hashtag', 'history'],
        'readwrite'
      )

      const historyStore = context.tx.objectStore('history')
      const hashtagStore = context.tx.objectStore('hashtag')

      const hashtagRecord: Record<string, Set<string>> = {}

      for (const downloadHistory of downloadHistories) {
        await historyStore.put(downloadHistoryToIDBItem(downloadHistory))

        for (const hashtag of downloadHistory.mapBy((_, props) => props.hashtags)) {
          if (hashtag in hashtagRecord) {
            hashtagRecord[hashtag].add(downloadHistory.id.value)
          } else {
            hashtagRecord[hashtag] = new Set([downloadHistory.id.value])
          }
        }
      }

      for (const [hashtag, ids] of Object.entries(hashtagRecord)) {
        const item = await hashtagStore.get(IDBKeyRange.only(hashtag))

        await hashtagStore.put({
          name: hashtag,
          tweetIds: item ? new Set([...ids, ...Array.from(item.tweetIds)]) : new Set(ids),
        })
      }

      context.completeTx()
    } catch (error) {
      context?.abortTx()
      return toError(error)
    }
  }
}

const downloadHistoryDBItemToProtableHistoryItem: Factory<
  DownloadHistoryItem,
  V5PortableDownloadHistoryItem
> = item =>
  new V5PortableDownloadHistoryItem({
    displayName: item.displayName,
    downloadTime: item.downloadTime,
    hashtags: Array.from(item.hashtags),
    mediaType: item.mediaType,
    screenName: item.screenName,
    thumbnail: item.thumbnail ?? '',
    tweetId: item.tweetId,
    userId: item.userId,
    tweetTime: item.tweetTime,
  })
