/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import type {
  Query,
  SearchTweetIdsByHashTags,
} from '#domain/useCases/searchTweetIdsByHashtags'
import type { AbortTx } from '#libs/idb/base'
import type { DownloadIDB } from '#libs/idb/download/db'
import { nullAbort } from '#libs/idb/utils'
import { toErrorResult, toSuccessResult } from '#utils/result'
import * as TE from 'fp-ts/TaskEither'
import { toError } from 'fp-ts/lib/Either'
import { isEmpty } from 'fp-ts/lib/Set'
import { pipe } from 'fp-ts/lib/function'

type IdSet = Set<string>

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

const arrayHashtagsToSet = (hashtags: Iterable<string>) => new Set(hashtags)

const makeEmptyIdSet = () => new Set<string>()

export class SearchTweetIdsByHashtagsFromIDB
  implements SearchTweetIdsByHashTags
{
  constructor(readonly downloadIdb: DownloadIDB) {}

  async process(command: Query): Promise<Result<IdSet, Error>> {
    if (command.hashtags.length === 0) return toSuccessResult(new Set())

    const searchTask = pipe(
      TE.tryCatch(
        () => this.downloadIdb.prepareTransaction('hashtag', 'readonly'),
        toTransactionError()
      ),
      TE.bind('hashtags', context =>
        TE.tryCatch(
          async () => arrayHashtagsToSet(command.hashtags),
          toTransactionError(context.abortTx)
        )
      ),
      TE.bind('hashtagCollection', context =>
        TE.tryCatch(
          async () => context.tx.objectStore('hashtag'),
          toTransactionError(context.abortTx)
        )
      ),
      TE.bind('ids', context =>
        TE.tryCatch(async () => {
          let ids = makeEmptyIdSet()

          const updateIds = (() => {
            let isInitialized = false

            return (newIds: IdSet) => (ids: IdSet) => {
              if (!isInitialized) {
                isInitialized = true
                return ids.union(newIds)
              } else {
                return ids.intersection(newIds)
              }
            }
          })()

          for (const hashtag of context.hashtags) {
            const item = await context.hashtagCollection.get(
              IDBKeyRange.only(hashtag)
            )

            // if there is no id in item, we ignore remaining hashtags.
            if (!item) return makeEmptyIdSet()
            if (isEmpty(item.tweetIds)) return item.tweetIds

            ids = updateIds(item.tweetIds)(ids)
            if (isEmpty(ids)) return ids
          }

          return ids
        }, toTransactionError(context.abortTx))
      ),
      TE.match(
        e => ({ done: e.abort, result: toErrorResult<IdSet>(e.error) }),
        context => ({
          done: context.completeTx,
          result: toSuccessResult(context.ids),
        })
      )
    )

    const search = pipe(
      searchTask,
      TE.fromTask,
      TE.tap(task => TE.tryCatch(() => task.done(), toError)),
      TE.match(toErrorResult<IdSet>, ({ result }) => result)
    )

    return search()
  }
}
