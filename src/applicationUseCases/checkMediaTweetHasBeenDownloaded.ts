import type { IDownloadHistoryRepository } from '#domain/repositories/downloadHistory'
import type { AsyncUseCase } from '#domain/useCases/base'

type CheckMediaTweetHasBeenDownloadedCommand = {
  tweetId: string
}

export type InfraProvider = {
  downloadHistoryRepo: IDownloadHistoryRepository
}

/**
 * This use case was used to check the media tweet has been downloaded or not,
 * even if there are some errors occured, it is okay to return false.
 */
export class CheckMediaTweetHasBeenDownloaded
  implements AsyncUseCase<CheckMediaTweetHasBeenDownloadedCommand, boolean>
{
  constructor(readonly infra: InfraProvider) {}

  async process(command: CheckMediaTweetHasBeenDownloadedCommand): Promise<boolean> {
    const { value: hasBeenDownloaded, error } =
      await this.infra.downloadHistoryRepo.hasTweetId(command.tweetId)

    // TODO: log error
    if (error) return false
    return hasBeenDownloaded
  }
}
