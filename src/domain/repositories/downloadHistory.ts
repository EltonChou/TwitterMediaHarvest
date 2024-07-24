import type { DownloadHistory } from '#domain/entities/downloadHistory'

export interface IDownloadHistoryRepository {
  save(item: DownloadHistory): Promise<UnsafeTask>
  getByTweetId(tweetId: string): Promise<Result<DownloadHistory | undefined>>
  removeByTweetId(tweetId: string): Promise<UnsafeTask>
}
