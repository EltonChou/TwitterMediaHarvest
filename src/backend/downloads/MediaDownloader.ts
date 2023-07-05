import type { DownloadSettings, FeatureSettings, V4FilenameSettings } from '@schema'
import browser from 'webextension-polyfill'
import { storageConfig } from '../configurations'
import { HarvestError } from '../errors'
import type { DownloadItemRecorder } from './downloadItemRecorder'
import { downloadItemRecorder } from './downloadItemRecorder'
import TwitterMediaFile, { DownloadMode } from './TwitterMediaFile'

const ARIA2_ID =
  process.env.TARGET === 'chrome' ? 'mpkodccbngfoacfalldjimigbofkhgjn' : 'jjfgljkjddpcpfapejfkelkbjbehagbh'

export default class MediaDownloader {
  readonly tweetDetail: TweetDetail
  readonly filenameSettings: V4FilenameSettings
  readonly downloadSettings: DownloadSettings
  readonly featureSettings: FeatureSettings
  readonly mode: DownloadMode
  private record_config: DownloadItemRecorder

  constructor(
    tweetDetail: TweetDetail,
    filenameSettings: V4FilenameSettings,
    downloadSettings: DownloadSettings,
    featureSettings: FeatureSettings
  ) {
    this.tweetDetail = tweetDetail
    this.filenameSettings = filenameSettings
    this.downloadSettings = downloadSettings
    this.featureSettings = featureSettings
    this.mode = this.downloadSettings.enableAria2 ? DownloadMode.Aria2 : DownloadMode.Browser
    this.record_config = downloadItemRecorder({ tweetId: tweetDetail.id, screenName: tweetDetail.screenName })
  }

  static async build(tweetInfo: TweetDetail) {
    const fileNameSettings = await storageConfig.v4FilenameSettingsRepo.getSettings()
    const downloadSettings = await storageConfig.downloadSettingsRepo.getSettings()
    const featureSettings = await storageConfig.featureSettingsRepo.getSettings()
    return new MediaDownloader(tweetInfo, fileNameSettings, downloadSettings, featureSettings)
  }

  private async downloadMedia(media_url: string, index: number): Promise<void> {
    if (!TwitterMediaFile.isValidFileUrl(media_url)) throw new HarvestError(`Invalid url: ${media_url}`)

    if (!this.featureSettings.includeVideoThumbnail && media_url.includes('video_thumb')) return

    const mediaFile = new TwitterMediaFile(this.tweetDetail, media_url, index, this.downloadSettings.askWhereToSave)
    const config = mediaFile.makeDownloadConfigBySetting(this.filenameSettings, this.mode)

    this.mode === DownloadMode.Aria2
      ? browser.runtime.sendMessage(ARIA2_ID, config)
      : browser.downloads.download(config).then(downloadId => this.record_config(config)(downloadId))
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
