import { DownloadHistory, DownloadHistoryId } from '#domain/entities/downloadHistory'
import type { Factory } from '#domain/factories/base'
import type {
  DownloadHistoryStats,
  IDownloadHistoryRepository,
} from '#domain/repositories/downloadHistory'
import { TweetUser } from '#domain/valueObjects/tweetUser'
import type { DownloadIDB } from '#libs/idb/download/db'
import type { DownloadHistoryItem } from '#libs/idb/download/schema'
import type { DownloadDBSchema } from '#libs/idb/download/schema'
import { toErrorResult, toSuccessResult } from '#utils/result'
import * as TE from 'fp-ts/TaskEither'
import { toError } from 'fp-ts/lib/Either'
import { pipe } from 'fp-ts/lib/function'
import type { IDBPObjectStore } from 'idb'

type WorkflowContext = {
  tweetId: string
  historyCollection: WritableHistoryCollection
  hashtagCollection: WritableHashtagCollection
  hashtagDelta: HashtagDelta
  completeTransaction: () => void
  abortTransaction: () => void
}

type AbortableError = {
  error: Error | undefined
  abort: () => void
}

type WritableHistoryCollection =
  | IDBPObjectStore<DownloadDBSchema, ('history' | 'hashtag')[], 'history', 'readwrite'>
  | IDBPObjectStore<DownloadDBSchema, 'history'[], 'history', 'readwrite'>

type WritableHashtagCollection =
  | IDBPObjectStore<DownloadDBSchema, ('history' | 'hashtag')[], 'hashtag', 'readwrite'>
  | IDBPObjectStore<DownloadDBSchema, 'hashtag'[], 'hashtag', 'readwrite'>

type HashtagDelta = Delta<Set<string>>

const prepareTransactionContext = async (idb: DownloadIDB) => {
  const client = await idb.connect()
  const tx = client.transaction(['hashtag', 'history'], 'readwrite')
  const completeTransaction = () => {
    tx.commit()
    client.close()
  }

  const abortTransaction = () => {
    tx.abort()
    client.close()
  }

  const historyCollection = tx.objectStore('history')
  const hashtagCollection = tx.objectStore('hashtag')

  return {
    historyCollection,
    hashtagCollection,
    completeTransaction,
    abortTransaction,
  }
}

const toErrorWithAbort =
  (abort: () => void) =>
  (error: unknown): AbortableError => ({
    error: toError(error),
    abort,
  })

const calcHashtagDelta = ({
  current: currentHistory,
  previous: previousHistory,
}: NullableDelta<DownloadHistory>): HashtagDelta => {
  const existHashtags = previousHistory
    ? previousHistory.mapBy((_, props) => new Set(props.hashtags))
    : new Set<string>()
  const currHashtags = currentHistory
    ? currentHistory.mapBy((_, props) => new Set(props.hashtags))
    : new Set<string>()

  return {
    current: currHashtags,
    previous: existHashtags,
  }
}

export class IDBDownloadHistoryRepository implements IDownloadHistoryRepository {
  constructor(readonly idb: DownloadIDB) {}

  async total(): AsyncResult<DownloadHistoryStats> {
    try {
      const client = await this.idb.connect()
      const historyTotal = await client.count('history')
      const hashtagTotal = await client.count('hashtag')
      return toSuccessResult({ historyTotal, hashtagTotal })
    } catch (error) {
      return toErrorResult(toError(error))
    }
  }

  async clear(): Promise<UnsafeTask> {
    const clear = pipe(
      TE.tryCatch(
        () => prepareTransactionContext(this.idb),
        toErrorWithAbort(() => undefined)
      ),
      TE.tap(context =>
        TE.tryCatch(
          () =>
            Promise.all([
              context.hashtagCollection.clear(),
              context.historyCollection.clear(),
            ]),
          toErrorWithAbort(context.abortTransaction)
        )
      ),
      TE.match(
        e => ({ error: e.error, complete: e.abort }),
        context => ({ error: undefined, complete: context.completeTransaction })
      )
    )

    const clearTask = await clear()

    clearTask.complete()
    return clearTask.error
  }

  async save(downloadHistory: DownloadHistory): Promise<UnsafeTask> {
    const prepareContext = pipe(
      TE.tryCatch(
        () => prepareTransactionContext(this.idb),
        toErrorWithAbort(() => undefined)
      ),
      TE.flatMap(context => TE.of({ ...context, tweetId: downloadHistory.id.value })),
      TE.flatMap(context =>
        TE.tryCatch(async () => {
          const existHistory = await context.historyCollection.get(
            downloadHistory.id.value
          )
          const currHistory = existHistory
            ? dbItemToDownloadHistory(existHistory)
            : undefined

          const hashtagDelta = calcHashtagDelta({
            previous: currHistory,
            current: downloadHistory,
          })

          return { ...context, hashtagDelta }
        }, toErrorWithAbort(context.abortTransaction))
      )
    )

    const process = pipe(
      prepareContext,
      TE.tap(context =>
        TE.tryCatch(
          () => removeHashtagsRelationship(context),
          toErrorWithAbort(context.abortTransaction)
        )
      ),
      TE.tap(context =>
        TE.tryCatch(
          () => addHashtagsRelationship(context),
          toErrorWithAbort(context.abortTransaction)
        )
      ),
      TE.tap(context =>
        pipe(
          saveHistory(downloadHistory)(context.historyCollection),
          TE.mapError(toErrorWithAbort(context.abortTransaction))
        )
      ),
      TE.match(
        e => ({ error: e.error, complete: e.abort }),
        context => ({ error: undefined, complete: context.completeTransaction })
      )
    )

    const task = await process()
    task.complete()
    return task.error
  }

  async getByTweetId(tweetId: string): Promise<Result<DownloadHistory | undefined>> {
    try {
      const client = await this.idb.connect()
      const item = await client.get('history', tweetId)
      return toSuccessResult(item ? dbItemToDownloadHistory(item) : item)
    } catch (error) {
      return toErrorResult(toError(error))
    }
  }

  async removeByTweetId(tweetId: string): Promise<UnsafeTask> {
    const prepare = TE.tryCatch(
      () => prepareTransactionContext(this.idb),
      toErrorWithAbort(() => undefined)
    )

    const process = pipe(
      prepare,
      TE.tap(context =>
        TE.tryCatch(async () => {
          const historyItem = await context.historyCollection.get(tweetId)
          if (!historyItem) return

          await context.historyCollection.delete(tweetId)
          await Promise.allSettled(
            Array.from(historyItem.hashtags).map(hashtag =>
              removeHashtagTweetIdRelationship({ tweetId, hashtag })(
                context.hashtagCollection
              )
            )
          )
        }, toErrorWithAbort(context.abortTransaction))
      ),
      TE.match(
        e => ({ complete: e.abort }),
        context => ({ complete: context.completeTransaction })
      )
    )

    const task = await process()
    return task.complete()
  }
}

const saveHistory =
  (history: DownloadHistory) => (collection: WritableHistoryCollection) =>
    TE.tryCatch(() => collection.put(downloadHistoryToDBItem(history)), toError)

const removeHashtagsRelationship = ({
  hashtagDelta,
  tweetId,
  hashtagCollection,
}: WorkflowContext) =>
  Promise.allSettled(
    Array.from(hashtagDelta.previous)
      .filter(prevHashtag => !hashtagDelta.current.has(prevHashtag))
      .map(hashtag =>
        removeHashtagTweetIdRelationship({ hashtag, tweetId })(hashtagCollection)
      )
  )

const addHashtagsRelationship = ({
  hashtagDelta,
  tweetId,
  hashtagCollection,
}: WorkflowContext) =>
  Promise.allSettled(
    Array.from(hashtagDelta.current)
      .filter(currHashtag => !hashtagDelta.previous.has(currHashtag))
      .map(hashtag =>
        addHashtagTweetIdRelationship({ tweetId, hashtag })(hashtagCollection)
      )
  )

type HashtagRelationship = {
  tweetId: string
  hashtag: string
}

const removeHashtagTweetIdRelationship =
  (relationship: HashtagRelationship) =>
  async (collection: WritableHashtagCollection) => {
    const hashtagItem = await collection.get(relationship.hashtag)
    if (!hashtagItem) return
    if (!hashtagItem.tweetIds.has(relationship.tweetId)) return

    hashtagItem.tweetIds.delete(relationship.tweetId)
    await collection.put(hashtagItem)
  }

const addHashtagTweetIdRelationship =
  (relationship: HashtagRelationship) =>
  async (collection: WritableHashtagCollection) => {
    let hashtagItem = await collection.get(relationship.hashtag)
    if (hashtagItem) {
      hashtagItem.tweetIds.add(relationship.tweetId)
    } else {
      hashtagItem = {
        name: relationship.hashtag,
        tweetIds: new Set(relationship.tweetId),
      }
    }

    await collection.put(hashtagItem)
  }

// Mapper

const dbItemToDownloadHistory: Factory<DownloadHistoryItem, DownloadHistory> = item => {
  const id = new DownloadHistoryId(item.tweetId)
  const history = new DownloadHistory(id, {
    downloadTime: item.downloadTime,
    hashtags: Array.from(item.hashtags),
    thumbnail: item.thumbnail,
    mediaType: item.mediaType,
    tweetTime: item.tweetTime,
    tweetUser: new TweetUser({
      displayName: item.displayName,
      screenName: item.screenName,
      userId: item.userId,
    }),
  })
  return history
}

const downloadHistoryToDBItem: Factory<
  DownloadHistory,
  DownloadHistoryItem
> = downloadHistory =>
  downloadHistory.mapBy((id, props) => ({
    ...props.tweetUser.mapBy(props => props),
    hashtags: new Set(props.hashtags),
    mediaType: props.mediaType,
    tweetId: id.value,
    tweetTime: props.tweetTime,
    downloadTime: props.downloadTime,
  }))
