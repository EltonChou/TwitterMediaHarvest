import { storageConfig } from '../configurations'
import DownloadRecord from '../downloadRecords/models'

export const downloadItemRecorder =
  (tweetInfo: TweetInfo): DownloadItemRecorder => config => downloadId => {
    const record = new DownloadRecord(downloadId, {
      tweetInfo: tweetInfo,
      downloadConfig: config
    })

    storageConfig.downloadRecordRepo.save(record)
  }
