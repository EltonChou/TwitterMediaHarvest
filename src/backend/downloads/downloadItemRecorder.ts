import { storageConfig } from '../configurations'
import DownloadRecord from '../downloadRecords/models'
import type { Downloads } from 'webextension-polyfill'

export type DownloadItemRecorder = (config: Downloads.DownloadOptionsType) => (downloadId: number) => void

export const downloadItemRecorder =
  (tweetInfo: TweetInfo): DownloadItemRecorder =>
  config =>
  downloadId => {
    const record = new DownloadRecord(downloadId, {
      tweetInfo: tweetInfo,
      downloadConfig: config,
    })

    storageConfig.downloadRecordRepo.save(record)
  }
