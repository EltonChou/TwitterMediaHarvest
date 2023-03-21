import browser from 'webextension-polyfill'
import { ARIA2_ID } from '../../constants'
import { storageConfig } from '../configurations'
import { HarvestError } from '../errors'
import type { DownloadItemRecorder } from './downloadItemRecorder'
import { downloadItemRecorder } from './downloadItemRecorder'
import TwitterMediaFile, { DownloadMode } from './TwitterMediaFile'

export default class MediaDownloader {
  readonly tweetInfo: TweetInfo
  readonly filenameSettings: FilenameSettings
  readonly downloadSettings: DownloadSettings
  readonly mode: DownloadMode
  private record_config: DownloadItemRecorder

  constructor(tweetInfo: TweetInfo, filenameSettings: FilenameSettings, downloadSettings: DownloadSettings) {
    this.tweetInfo = tweetInfo
    this.filenameSettings = filenameSettings
    this.downloadSettings = downloadSettings
    this.mode = this.downloadSettings.enableAria2 ? DownloadMode.Aria2 : DownloadMode.Browser
    this.record_config = downloadItemRecorder(tweetInfo)
  }

  static async build(tweetInfo: TweetInfo) {
    const fileNameSettings = await storageConfig.filenameSettingsRepo.getSettings()
    const downloadSettings = await storageConfig.downloadSettingsRepo.getSettings()
    return new MediaDownloader(tweetInfo, fileNameSettings, downloadSettings)
  }

  private async downloadMedia(media_url: string, index: number): Promise<void> {
    if (!TwitterMediaFile.isValidFileUrl(media_url)) throw new HarvestError(`Invalid url: ${media_url}`)

    if (!this.downloadSettings.includeVideoThumbnail && media_url.includes('video_thumb')) return

    const mediaFile = new TwitterMediaFile(this.tweetInfo, media_url, index)
    const config = mediaFile.makeDownloadConfigBySetting(this.filenameSettings, this.mode)

    const downloadCallback = this.record_config(config)
    this.mode === DownloadMode.Aria2
      ? browser.runtime.sendMessage(ARIA2_ID, config)
      : browser.downloads.download(config).then(downloadCallback)
  }

  downloadMediasByMediaCatalog(mediaCatalog: TweetMediaCatalog) {
    for (const [category, items] of Object.entries(mediaCatalog)) {
      if (items.length) {
        items.forEach((media_url, index) => {
          this.downloadMedia(media_url, index)
        })
      }
    }
  }
}
