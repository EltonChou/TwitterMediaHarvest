import type { DownloadHistory } from '#domain/entities/downloadHistory'
import type { IDownloadHistoryRepository } from '#domain/repositories/downloadHistory'

export class MockDownloadHistoryRepository implements IDownloadHistoryRepository {
  async save(item: DownloadHistory): Promise<UnsafeTask> {
    throw new Error('Method not implemented.')
  }
  async getByTweetId(tweetId: string): Promise<Result<DownloadHistory | undefined>> {
    throw new Error('Method not implemented.')
  }
  async removeByTweetId(tweetId: string): Promise<UnsafeTask> {
    throw new Error('Method not implemented.')
  }
}
