import type { DownloadHistory } from '#domain/entities/downloadHistory'

export type DownloadHistoryStats = {
  historyTotal: number
  hashtagTotal: number
}

export interface IDownloadHistoryRepository {
  total(): AsyncResult<DownloadHistoryStats>
  save(item: DownloadHistory): Promise<UnsafeTask>
  getByTweetId(tweetId: string): AsyncResult<DownloadHistory | undefined>
  removeByTweetId(tweetId: string): Promise<UnsafeTask>
  clear(): Promise<UnsafeTask>
  hasTweetId(tweetId: string): AsyncResult<boolean>
}
