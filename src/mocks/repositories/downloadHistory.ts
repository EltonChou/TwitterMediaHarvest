import type { DownloadHistory } from '#domain/entities/downloadHistory'
import type {
  DownloadHistoryStats,
  IDownloadHistoryRepository,
} from '#domain/repositories/downloadHistory'

export class MockDownloadHistoryRepository
  implements IDownloadHistoryRepository
{
  async hasTweetId(_tweetId: string): AsyncResult<boolean> {
    throw new Error('Method not implemented.')
  }
  async total(): AsyncResult<DownloadHistoryStats> {
    throw new Error('Method not implemented.')
  }
  async clear(): Promise<UnsafeTask> {
    throw new Error('Method not implemented.')
  }
  async save(_item: DownloadHistory): Promise<UnsafeTask> {
    throw new Error('Method not implemented.')
  }
  async getByTweetId(
    _tweetId: string
  ): Promise<Result<DownloadHistory | undefined>> {
    throw new Error('Method not implemented.')
  }
  async removeByTweetId(_tweetId: string): Promise<UnsafeTask> {
    throw new Error('Method not implemented.')
  }
}
