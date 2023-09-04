import * as A from 'fp-ts/lib/Array'
import * as Console from 'fp-ts/lib/Console'
import { toError } from 'fp-ts/lib/Either'
import * as T from 'fp-ts/lib/Task'
import * as TE from 'fp-ts/lib/TaskEither'
import { pipe } from 'fp-ts/lib/function'
import type { Downloads } from 'webextension-polyfill'
import browser from 'webextension-polyfill'

/**
 * @param tweetInfo twitter information
 */
export const isValidInfo = (tweetInfo: TweetInfo) =>
  Object.values(tweetInfo).every(v => v !== undefined)

const isSelfDownloadId = (downloadItem: Downloads.DownloadItem): boolean =>
  downloadItem?.byExtensionId === browser.runtime.id

const searchDownload = (query: Downloads.DownloadQuery) =>
  TE.tryCatch(() => browser.downloads.search(query), toError)

export const isDownloadedBySelf = (downloadId: number) =>
  pipe(
    T.of<Downloads.DownloadQuery>({
      id: downloadId,
    }),
    TE.fromTask,
    TE.chain(searchDownload),
    TE.mapLeft(e => pipe(e, Console.error, TE.fromIO)),
    TE.match(
      () => false,
      items => pipe(items, A.filter(isSelfDownloadId), A.isNonEmpty)
    )
  )()

export const isFirefox = () => process.env.TARGET === 'firefox'
