import { DownloadSettingsUseCase } from '@backend/settings/downloadSettings/usaCases'
import V4FilenameSettingsUsecase from '@backend/settings/filenameSettings/usecase'
import type { DownloadSettings, FeatureSettings, V4FilenameSettings } from '@schema'
import Browser from 'webextension-polyfill'
import { storageConfig } from '../configurations'
import type { DownloadItemRecorder } from './downloadItemRecorder'
import { downloadItemRecorder } from './downloadItemRecorder'
import { isValidTweetMediaFileUrl } from './utils/checker'
import { TweetMediaFileVO } from './valueObjects'

const ARIA2_ID =
  process.env.TARGET === 'chrome' ? 'mpkodccbngfoacfalldjimigbofkhgjn' : 'jjfgljkjddpcpfapejfkelkbjbehagbh'

export default class MediaDownloader {
  constructor(
    readonly filenameSettings: V4FilenameSettings,
    readonly downloadSettings: DownloadSettings,
    readonly featureSettings: FeatureSettings
  ) {}

  static async build() {
    const fileNameSettings = await storageConfig.v4FilenameSettingsRepo.getSettings()
    const downloadSettings = await storageConfig.downloadSettingsRepo.getSettings()
    const featureSettings = await storageConfig.featureSettingsRepo.getSettings()
    return new MediaDownloader(fileNameSettings, downloadSettings, featureSettings)
  }

  private async downloadMedia(source: string, filePath: string, recorder: DownloadItemRecorder): Promise<void> {
    const downloadSettingsUseCase = new DownloadSettingsUseCase(this.downloadSettings)
    const config = downloadSettingsUseCase.makeDownloadConfig(source, filePath)

    this.downloadSettings.enableAria2
      ? Browser.runtime.sendMessage(ARIA2_ID, config)
      : Browser.downloads.download(config).then(downloadId => recorder(config)(downloadId))
  }

  async downloadMediasByMediaCatalog(tweetDetail: TweetDetail, mediaCatalog: TweetMediaCatalog) {
    const recordConfig = downloadItemRecorder({ tweetId: tweetDetail.id, screenName: tweetDetail.screenName })
    const filenameUseCase = new V4FilenameSettingsUsecase(this.filenameSettings)

    const shouldBeDownloaded = (mediaUrl: string) =>
      mediaUrl.includes('video_thumb')
        ? !this.featureSettings.includeVideoThumbnail
        : true && isValidTweetMediaFileUrl(mediaUrl)

    const makeFilePath = (mediaFile: ITweetMediaFileDetail) => {
      const filename = filenameUseCase.makeFilename(tweetDetail, {
        serial: mediaFile.order,
        hash: mediaFile.hashName,
        date: new Date(),
      })
      const fileFullPath = filenameUseCase.makeFullPathWithFilenameAndExt(filename, mediaFile.ext)
      return fileFullPath
    }

    const downloadMedias = async (mediaUrls: string[]) =>
      mediaUrls
        .filter(url => shouldBeDownloaded(url))
        .forEach(async (url, i) => {
          const mediaFile = new TweetMediaFileVO(url, i)
          await this.downloadMedia(mediaFile.src, makeFilePath(mediaFile), recordConfig)
        })

    Object.entries(mediaCatalog).forEach(async ([category, medias]) => await downloadMedias(medias))
  }
}
