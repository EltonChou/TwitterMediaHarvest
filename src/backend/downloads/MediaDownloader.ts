import browser from 'webextension-polyfill'
import { storageConfig } from '../configurations'
import { HarvestError } from '../errors'
import type { DownloadItemRecorder } from './downloadItemRecorder'
import { downloadItemRecorder } from './downloadItemRecorder'
import TwitterMediaFile, { DownloadMode } from './TwitterMediaFile'

const ARIA2_ID =
  process.env.TARGET === 'chrome' ? 'mpkodccbngfoacfalldjimigbofkhgjn' : 'jjfgljkjddpcpfapejfkelkbjbehagbh'

export default class MediaDownloader {
  readonly tweetInfo: TweetInfo
  readonly filenameSettings: V4FilenameSettings
  readonly downloadSettings: DownloadSettings
  readonly featureSettings: FeatureSettings
  readonly mode: DownloadMode
  private record_config: DownloadItemRecorder

  constructor(
    tweetInfo: TweetInfo,
    filenameSettings: V4FilenameSettings,
    downloadSettings: DownloadSettings,
    featureSettings: FeatureSettings
  ) {
    this.tweetInfo = tweetInfo
    this.filenameSettings = filenameSettings
    this.downloadSettings = downloadSettings
    this.featureSettings = featureSettings
    this.mode = this.downloadSettings.enableAria2 ? DownloadMode.Aria2 : DownloadMode.Browser
    this.record_config = downloadItemRecorder(tweetInfo)
  }

  static async build(tweetInfo: TweetInfo) {
    const fileNameSettings = await storageConfig.v4FilenameSettingsRepo.getSettings()
    const downloadSettings = await storageConfig.downloadSettingsRepo.getSettings()
    const featureSettings = await storageConfig.featureSettingsRepo.getSettings()
    return new MediaDownloader(tweetInfo, fileNameSettings, downloadSettings, featureSettings)
  }

  private async downloadMedia(media_url: string, index: number): Promise<void> {
    if (!TwitterMediaFile.isValidFileUrl(media_url)) throw new HarvestError(`Invalid url: ${media_url}`)

    if (!this.featureSettings.includeVideoThumbnail && media_url.includes('video_thumb')) return

    const mediaFile = new TwitterMediaFile(this.tweetInfo, media_url, index)
    const config = mediaFile.makeDownloadConfigBySetting(this.filenameSettings, this.mode)

    const downloadCallback = this.record_config(config)
    this.mode === DownloadMode.Aria2
      ? browser.runtime.sendMessage(ARIA2_ID, config)
      : browser.downloads.download(config).then(downloadCallback)
  }

  downloadMediasByMediaCatalog(mediaCatalog: TweetMediaCatalog) {
    Object.entries(mediaCatalog).forEach(([category, items]) => {
      if (items.length) {
        items.forEach((media_url, index) => {
          this.downloadMedia(media_url, index)
        })
      }
    })
  }
}
