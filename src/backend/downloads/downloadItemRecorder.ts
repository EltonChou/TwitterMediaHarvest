import {
  setLocalStorage,
} from '../../libs/chromeApi'


export const downloadItemRecorder =
  (tweetInfo: TweetInfo): DownloadItemRecorder => config => downloadId => {
    const recordId: DownloadRecordId = `dl_${downloadId}`
    const record: { [key: DownloadRecordId]: DownloadRecord } = {}

    record[recordId] = {
      info: tweetInfo,
      config: config,
    }

    setLocalStorage(record)
  }
