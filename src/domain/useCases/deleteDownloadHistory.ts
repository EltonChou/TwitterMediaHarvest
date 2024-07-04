import type { IDownloadHistoryRepository } from '#domain/repositories/downloadHistory'
import type { AsyncUseCase } from './base'
import type { UpdateTweetHashTagCollection } from './updateTweetHashTagCollection'

type DeleteDownloadHistoryCommand = {
  tweetId: string
}

export class DeleteDownloadHistory
  implements AsyncUseCase<DeleteDownloadHistoryCommand, void>
{
  constructor(
    readonly downloadHistoryRepo: IDownloadHistoryRepository,
    readonly updateTagCollection: UpdateTweetHashTagCollection
  ) {}

  async process(command: DeleteDownloadHistoryCommand): Promise<void> {
    const downloadHistory = await this.downloadHistoryRepo.getByTweetId(command.tweetId)

    await this.updateTagCollection.process({
      operation: 'remove',
      target: downloadHistory,
    })
    await this.downloadHistoryRepo.removeByTweetId(command.tweetId)
  }
}
