import type { AsyncUseCase } from './base'

type HasMediaTweetBeenDownloadedCommand = {
  tweetId: string
}

export type HasMediaTweetBeenDownloaded = AsyncUseCase<
  HasMediaTweetBeenDownloadedCommand,
  boolean
>
