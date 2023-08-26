import { DownloadRecord } from './models'
import type { IDownloadRecordsRepository } from './repositories'
import type { Downloads } from 'webextension-polyfill'

export type DownloadItemRecorder = (
  config: Downloads.DownloadOptionsType
) => (downloadId: number) => void

export const downloadItemRecorder =
  (recordRepo: IDownloadRecordsRepository) =>
  (tweetInfo: TweetInfo): DownloadItemRecorder =>
  config =>
  downloadId => {
    const record = new DownloadRecord(downloadId, {
      tweetInfo: tweetInfo,
      downloadConfig: config,
    })

    recordRepo.save(record)
  }
