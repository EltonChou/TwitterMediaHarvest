import type { DownloadTarget } from '#domain/valueObjects/downloadTarget'
import type { TweetInfo } from '#domain/valueObjects/tweetInfo'
import type { AsyncUseCase } from './base'

export type DownloadMediaFileCommand = {
  target: DownloadTarget
}

export interface DownloadMediaFileUseCase
  extends AsyncUseCase<DownloadMediaFileCommand, void>,
    DomainEventSource {
  isOk: boolean
}

type BuilderParams = {
  targetTweet: TweetInfo
  shouldPrompt: boolean
}

export type DownloadMediaFileUseCaseBuilder = (
  params: BuilderParams
) => DownloadMediaFileUseCase
