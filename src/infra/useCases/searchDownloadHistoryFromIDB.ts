import { DownloadHistory, DownloadHistoryId } from '#domain/entities/downloadHistory'
import type { Factory } from '#domain/factories/base'
import type {
  OrderCriteria,
  Query,
  QueryResult,
  SearchDownloadHistoryUseCase,
} from '#domain/useCases/searchDownloadHistory'
import { TweetUser } from '#domain/valueObjects/tweetUser'
import type { DownloadIDB } from '#libs/idb/download/db'
import type { DownloadHistoryItem } from '#libs/idb/download/schema'
import type { DownloadDBSchema } from '#libs/idb/download/schema'
import * as TE from 'fp-ts/TaskEither'
import { toError } from 'fp-ts/lib/Either'
import { pipe } from 'fp-ts/lib/function'
import type { IndexNames } from 'idb'

export class SearchDownloadHistoryFromIDB implements SearchDownloadHistoryUseCase {
  constructor(readonly downloadIDB: DownloadIDB) {}

  async process(command: Query): Promise<QueryResult> {
    const client = await this.downloadIDB.connect()
    const tx = client.transaction('history', 'readonly')

    const completeTransaction = () => {
      tx.commit()
      client.close()
    }

    const openCursor = TE.tryCatch(
      () =>
        tx
          .objectStore('history')
          .index(orderKeyMap.get(command.orderBy.key) ?? 'byDownloadTime')
          // TODO: Use tweet ids to optimize key range. 1. Add new index.
          .openCursor(null, orderTypeMap.get(command.orderBy.type) ?? 'prev'),
      toError
    )

    const searchTask = pipe(
      openCursor,
      TE.chain(cursor =>
        TE.tryCatch(async () => {
          let matchedCount = 0
          const items: DownloadHistory[] = []
          const isNotEnough = () => items.length < command.limit
          const shouldAppendItem = () => isNotEnough() && command.skip === 0
          const shouldSkip = () => command.skip > 0
          const increaseMatched = () => (matchedCount += 1)
          const consumeSkip = () => (command.skip -= 1)

          while (cursor) {
            if (command.filters.every(filter => cursor && filter(cursor.value))) {
              increaseMatched()
              if (shouldSkip()) {
                consumeSkip()
                continue
              }
              if (shouldAppendItem())
                items.push(downloadHistoryItemToDownloadHistoryEntity(cursor.value))
            }
            // Unsafe
            cursor = await cursor.continue()
          }

          return { matchedCount, items, error: undefined }
        }, toError)
      ),
      TE.match(makeErrorResult, r => r)
    )

    const result = await searchTask()

    completeTransaction()
    return result
  }
}

const makeErrorResult = (error: Error | unknown): QueryResult => ({
  error: error as Error,
  matchedCount: -1,
  items: [],
})

const downloadHistoryItemToDownloadHistoryEntity: Factory<
  DownloadHistoryItem,
  DownloadHistory
> = item =>
  new DownloadHistory(new DownloadHistoryId(item.tweetId), {
    downloadTime: item.downloadTime,
    hashtags: Array.from(item?.hashtags ?? []),
    mediaType: item.mediaType,
    tweetTime: item.tweetTime,
    tweetUser: new TweetUser({
      displayName: item.displayName,
      userId: item.userId,
      screenName: item.screenName,
    }),
  })

const orderTypeMap: ReadonlyMap<OrderCriteria['type'], IDBCursorDirection> = new Map([
  ['asc', 'next'],
  ['desc', 'prev'],
])

const orderKeyMap: ReadonlyMap<
  OrderCriteria['key'],
  IndexNames<DownloadDBSchema, 'history'>
> = new Map([
  ['downloadTime', 'byDownloadTime'],
  ['tweetTime', 'byTweetTime'],
])
