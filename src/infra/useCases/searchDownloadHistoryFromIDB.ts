/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import {
  DownloadHistory,
  DownloadHistoryId,
} from '#domain/entities/downloadHistory'
import type { Factory } from '#domain/factories/base'
import type {
  OrderCriteria,
  Query,
  QueryResult,
  SearchDownloadHistory,
} from '#domain/useCases/searchDownloadHistory'
import { DownloadHistoryTweetUser } from '#domain/valueObjects/downloadHistoryTweetUser'
import type { AbortTx } from '#libs/idb/base'
import type { DownloadIDB } from '#libs/idb/download/db'
import type { DownloadHistoryItem } from '#libs/idb/download/schema'
import type { DownloadDBSchema } from '#libs/idb/download/schema'
import { nullAbort } from '#libs/idb/utils'
import * as TE from 'fp-ts/TaskEither'
import { toError } from 'fp-ts/lib/Either'
import { pipe } from 'fp-ts/lib/function'
import type { IndexNames } from 'idb'

type TransactionError = {
  error: Error
  abort: AbortTx
}

const toTransactionError =
  (abort = nullAbort) =>
  (err: unknown): TransactionError => ({
    error: toError(err),
    abort,
  })

export class SearchDownloadHistoryFromIDB implements SearchDownloadHistory {
  constructor(readonly downloadIDB: DownloadIDB) {}

  async process(command: Query): Promise<QueryResult> {
    const searchTask = pipe(
      TE.tryCatch(
        () => this.downloadIDB.prepareTransaction('history', 'readonly'),
        toTransactionError(nullAbort)
      ),
      TE.bind('historyCollection', context =>
        TE.tryCatch(
          async () => context.tx.objectStore('history'),
          toTransactionError(context.abortTx)
        )
      ),
      /**
       * TODO: Use tweet ids to optimize key range.
       * Need a new index like ['tweetId', 'downloadTime'] to sort.
       */
      TE.bind('cursor', context =>
        TE.tryCatch(
          () =>
            context.historyCollection
              .index(orderKeyMap.get(command.orderBy.key) ?? 'byDownloadTime')
              .openCursor(
                null,
                orderTypeMap.get(command.orderBy.type) ?? 'prev'
              ),
          toTransactionError(context.abortTx)
        )
      ),
      TE.bind('result', context =>
        TE.tryCatch(async () => {
          let matchedCount = 0
          let skip = command.skip

          const items: DownloadHistory[] = []
          const isNotEnough = () => items.length < command.limit
          const shouldAppendItem = () => isNotEnough() && skip === 0
          const shouldSkip = () => skip > 0

          // has side effect
          const increaseMatched = () => (matchedCount += 1)
          const consumeSkip = () => (skip -= 1)
          let cursor = context.cursor
          while (cursor) {
            const skipThisValue = shouldSkip()
            const isMatchedValue = command.filters.every(
              filter => cursor && filter(cursor.value)
            )

            if (isMatchedValue) increaseMatched()
            if (isMatchedValue && skipThisValue) consumeSkip()
            if (isMatchedValue && !skipThisValue && shouldAppendItem())
              items.push(
                downloadHistoryItemToDownloadHistoryEntity(cursor.value)
              )

            // Unsafe
            cursor = await cursor.continue()
          }

          return { matchedCount, items, error: undefined }
        }, toTransactionError(context.abortTx))
      ),
      TE.match(
        e => ({ done: e.abort, result: makeErrorResult(e.error) }),
        r => ({ done: r.completeTx, result: r.result })
      )
    )

    const search = pipe(
      searchTask,
      TE.fromTask,
      TE.tap(task => TE.tryCatch(() => task.done(), toError)),
      TE.match(makeErrorResult, ({ result }) => result)
    )

    return search()
  }
}

const makeErrorResult = (error: Error): QueryResult => ({
  error: error,
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
    tweetUser: new DownloadHistoryTweetUser({
      displayName: item.displayName,
      userId: item.userId,
      screenName: item.screenName,
    }),
    thumbnail: item.thumbnail,
  })

const orderTypeMap: ReadonlyMap<OrderCriteria['type'], IDBCursorDirection> =
  new Map([
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

const _calcTweetIdKeyRange = (tweetIds: Set<string>): IDBKeyRange => {
  const idRange = Array.from(tweetIds).reduce(
    ({ min, max }, id) => ({
      min: min ? (id <= min ? id : min) : id,
      max: max ? (id >= max ? id : max) : id,
    }),
    {
      min: '',
      max: '',
    }
  )

  return IDBKeyRange.bound(
    [idRange.min, new Date(0)],
    [idRange.max, new Date(0)]
  )
}
