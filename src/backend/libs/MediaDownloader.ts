
import { ARIA2_ID } from '../../constants'
import TwitterMediaFile, { DownloadMode } from '../libs/TwitterMediaFile'
import {
  downloadItemRecorder,
  fetchFileNameSetting,
  isEnableAria2,
} from '../helpers/storageHelper'

export default class MediaDownloader {
  public tweetInfo: TweetInfo
  public filenameSetting: FilenameSetting
  public isPassToAria2: boolean
  public mode: DownloadMode
  private record_config: DownloadItemRecorder

  constructor(
    tweetInfo: TweetInfo,
    filenameSetting: FilenameSetting,
    isPassToAria2: boolean
  ) {
    this.tweetInfo = tweetInfo
    this.filenameSetting = filenameSetting
    this.isPassToAria2 = isPassToAria2
    this.mode = this.isPassToAria2 ? DownloadMode.Aria2 : DownloadMode.Browser
    this.record_config = downloadItemRecorder(tweetInfo)
  }

  static async build(tweetInfo: TweetInfo) {
    const fileNameSettings = await fetchFileNameSetting()
    const isPassToAria2 = await isEnableAria2()
    return new MediaDownloader(tweetInfo, fileNameSettings, isPassToAria2)
  }

  downloadMedias(mediaList: string[]) {
    mediaList.forEach((value: string, index: number) => {
      if (!TwitterMediaFile.isValidFileUrl(value)) throw new Error(`Invalid url: ${value}`)

      const mediaFile = new TwitterMediaFile(this.tweetInfo, value, index)
      const config = mediaFile.makeDownloadConfigBySetting(
        this.filenameSetting,
        this.mode
      )

      const downloadCallback = this.record_config(config)
      this.isPassToAria2
        ? chrome.runtime.sendMessage(ARIA2_ID, config)
        : chrome.downloads.download(config, downloadCallback)
    })
  }
}
