import type { DownloadHistory } from '#domain/entities/downloadHistory'
import type { IDownloadHistoryRepository } from '#domain/repositories/downloadHistory'
import type { AsyncUseCase } from './base'
import type { UpdateTweetHashTagCollection } from './updateTweetHashTagCollection'

type SaveDownloadHistoryCommand = {
  downloadHistory: DownloadHistory
}

export class SaveDownloadHistory
  implements AsyncUseCase<SaveDownloadHistoryCommand, void>
{
  constructor(
    readonly downloadHistoryRepo: IDownloadHistoryRepository,
    readonly updateTagCollection: UpdateTweetHashTagCollection
  ) {}

  async process(command: SaveDownloadHistoryCommand): Promise<void> {
    await this.downloadHistoryRepo.save(command.downloadHistory)
    await this.updateTagCollection.process({
      operation: 'add',
      target: command.downloadHistory,
    })
  }
}
