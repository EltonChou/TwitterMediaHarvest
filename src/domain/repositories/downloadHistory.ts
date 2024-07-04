import type { DownloadHistory } from '#domain/entities/downloadHistory'

export interface IDownloadHistoryRepository {
  count(): Promise<number>
  save(item: DownloadHistory): Promise<void>
  getByTweetId(tweetId: string): Promise<DownloadHistory | undefined>
  removeByTweetId(tweetId: string): Promise<void>
}
