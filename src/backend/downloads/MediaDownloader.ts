
import { ARIA2_ID } from '../../constants'
import TwitterMediaFile, { DownloadMode } from './TwitterMediaFile'
import { downloadItemRecorder } from './downloadItemRecorder'
import FilenameSettingsRepository from '../filenameSettings/repository'
import DownloadSettingsRepository from '../downloadSettings/repository'
import { HarvestError } from '../errors'


const downloadSettingsRepo = new DownloadSettingsRepository(chrome.storage.local)
const filenameSettingsRepo = new FilenameSettingsRepository(chrome.storage.sync)


export default class MediaDownloader {
  readonly tweetInfo: TweetInfo
  readonly filenameSettings: FilenameSettings
  readonly downloadSettings: DownloadSettings
  readonly mode: DownloadMode
  private record_config: DownloadItemRecorder

  constructor(
    tweetInfo: TweetInfo,
    filenameSettings: FilenameSettings,
    downloadSettings: DownloadSettings,
  ) {
    this.tweetInfo = tweetInfo
    this.filenameSettings = filenameSettings
    this.downloadSettings = downloadSettings
    this.mode = this.downloadSettings.enableAria2 ? DownloadMode.Aria2 : DownloadMode.Browser
    this.record_config = downloadItemRecorder(tweetInfo)
  }

  static async build(tweetInfo: TweetInfo) {
    const fileNameSettings = await filenameSettingsRepo.getFilenameSettings()
    const downloadSettings = await downloadSettingsRepo.getDownloadSettings()
    return new MediaDownloader(tweetInfo, fileNameSettings, downloadSettings)
  }

  private async downloadMedia(media_url: string, index: number): Promise<void> {
    if (
      !TwitterMediaFile.isValidFileUrl(media_url)
    ) throw new HarvestError(`Invalid url: ${media_url}`)

    if (
      !this.downloadSettings.includeVideoThumbnail &&
      media_url.includes('tweet_video_thumb')
    ) return

    const mediaFile = new TwitterMediaFile(this.tweetInfo, media_url, index)
    const config = mediaFile.makeDownloadConfigBySetting(
      this.filenameSettings,
      this.mode
    )

    const downloadCallback = this.record_config(config)
    this.mode === DownloadMode.Aria2
      ? chrome.runtime.sendMessage(ARIA2_ID, config)
      : chrome.downloads.download(config, downloadCallback)
  }

  downloadMediasByMediaCatelog(mediaCatalog: TweetMediaCatalog) {
    for (const [category, items] of Object.entries(mediaCatalog)) {
      if (items.length) {
        items.forEach((media_url, index) => {
          this.downloadMedia(media_url, index)
        })
      }
    }
  }
}
