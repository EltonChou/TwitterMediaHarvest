/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
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
