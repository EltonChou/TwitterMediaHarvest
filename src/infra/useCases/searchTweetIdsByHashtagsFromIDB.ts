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

export class SearchTweetIdsByHashtagsFromIDB implements SearchTweetIdsByHashTags {
  constructor(readonly downloadIdb: DownloadIDB) {}

  async process(command: Query): Promise<Result<Set<string>, Error>> {
    const hashtags = new Set(command.hashtags)
    if (hashtags.size === 0) return toSuccessResult(new Set())

    const search = pipe(
      TE.tryCatch(
        () => this.downloadIdb.prepareTransaction('hashtag', 'readonly'),
        toTransactionError()
      ),
      TE.flatMap(context =>
        TE.tryCatch(async () => {
          const collection = context.tx.objectStore('hashtag')

          let ids: Set<string> | undefined = undefined

          for (const hashtag of hashtags) {
            const item = await collection.get(IDBKeyRange.only(hashtag))
            if (!item || item.tweetIds.size === 0)
              return { ...context, ids: new Set<string>() }

            if (ids === undefined) {
              ids = item.tweetIds
              continue
            }

            ids = new Set(Array.from(ids).filter(id => item.tweetIds.has(id)))
            if (ids.size === 0) break
          }

          return { ...context, ids: ids ?? new Set<string>() }
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
