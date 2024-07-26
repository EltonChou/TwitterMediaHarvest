import type {
  Query,
  SearchTweetIdsByHashTags,
} from '#domain/useCases/searchTweetIdsByHashtags'
import type { DownloadIDB } from '#libs/idb/download/db'
import { toErrorResult, toSuccessResult } from '#utils/result'
import * as TE from 'fp-ts/TaskEither'
import { toError } from 'fp-ts/lib/Either'
import { pipe } from 'fp-ts/lib/function'

type TransactionError = {
  error: Error
  abort: () => void
}

const toTransactionError =
  (abort = (): void => undefined) =>
  (err: unknown): TransactionError => ({
    error: toError(err),
    abort,
  })

const arrayHashtagsToSet = (hashtags: Iterable<string>) => new Set(hashtags)

export class SearchTweetIdsByHashtagsFromIDB implements SearchTweetIdsByHashTags {
  constructor(readonly downloadIdb: DownloadIDB) {}

  async process(command: Query): Promise<Result<Set<string>, Error>> {
    if (command.hashtags.length === 0) return toSuccessResult(new Set())

    const search = pipe(
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
          let ids: Set<string> | undefined = undefined

          for (const hashtag of context.hashtags) {
            const item = await context.hashtagCollection.get(IDBKeyRange.only(hashtag))
            if (!item || item.tweetIds.size === 0) return new Set<string>()

            ids = ids
              ? new Set(Array.from(ids).filter(id => item.tweetIds.has(id as string)))
              : item.tweetIds

            if (ids.size === 0) break
          }

          return ids ?? new Set<string>()
        }, toTransactionError(context.abortTx))
      ),
      TE.match(
        e => ({ done: e.abort, result: toErrorResult(e.error) }),
        context => ({ done: context.completeTx, result: toSuccessResult(context.ids) })
      )
    )

    const searchTask = await search()
    searchTask.done()
    return searchTask.result
  }
}
