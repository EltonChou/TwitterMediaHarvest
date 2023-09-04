import {
  downloadRecordRepo,
  downloadSettingsRepo,
  featureSettingsRepo,
  v4FilenameSettingsRepo,
} from '../configurations'
import type { DownloadItemRecorder } from './downloadItemRecorder'
import { downloadItemRecorder } from './downloadItemRecorder'
import { isValidTweetMediaFileUrl } from './utils/checker'
import { TweetMediaFileVO } from './valueObjects'
import { DownloadSettingsUseCase } from '@backend/settings/downloadSettings/useCases'
import V4FilenameSettingsUsecase from '@backend/settings/filenameSettings/usecase'
import type { DownloadSettings, FeatureSettings, V4FilenameSettings } from '@schema'
import Browser from 'webextension-polyfill'

const ARIA2_ID =
  process.env.TARGET === 'chrome'
    ? 'mpkodccbngfoacfalldjimigbofkhgjn'
    : 'jjfgljkjddpcpfapejfkelkbjbehagbh'

export default class MediaDownloader {
  constructor(
    readonly filenameSettings: V4FilenameSettings,
    readonly downloadSettings: DownloadSettings,
    readonly featureSettings: FeatureSettings
  ) {}

  static async build() {
    const fileNameSettings = await v4FilenameSettingsRepo.getSettings()
    const downloadSettings = await downloadSettingsRepo.getSettings()
    const featureSettings = await featureSettingsRepo.getSettings()
    return new MediaDownloader(fileNameSettings, downloadSettings, featureSettings)
  }

  private async downloadMedia(
    source: string,
    filePath: string,
    recorder: DownloadItemRecorder
  ): Promise<void> {
    const downloadSettingsUseCase = new DownloadSettingsUseCase(this.downloadSettings)
    const config = downloadSettingsUseCase.makeDownloadConfig(source, filePath)

    this.downloadSettings.enableAria2
      ? Browser.runtime.sendMessage(ARIA2_ID, config)
      : Browser.downloads
          .download(config)
          .then(downloadId => recorder(config)(downloadId))
  }

  downloadMediasByMediaCatalog(tweetDetail: TweetDetail) {
    return async (mediaCatalog: TweetMediaCatalog) => {
      const recordConfig = downloadItemRecorder(downloadRecordRepo)({
        tweetId: tweetDetail.id,
        screenName: tweetDetail.screenName,
      })
      const makeFilePath = buildFilePathMaker(
        new V4FilenameSettingsUsecase(this.filenameSettings)
      )(tweetDetail)

      const download = async (url: string, index: number) => {
        const mediaFile = new TweetMediaFileVO(url, index)
        await this.downloadMedia(mediaFile.src, makeFilePath(mediaFile), recordConfig)
      }

      Array.from(mediaCatalog.videos).filter(isValidTweetMediaFileUrl).forEach(download)

      Array.from(mediaCatalog.images)
        .filter(isValidTweetMediaFileUrl)
        .filter(shouldAllowThumbnail(this.featureSettings.includeVideoThumbnail))
        .forEach(download)
    }
  }
}

const shouldAllowThumbnail = (allow: boolean) =>
  allow ? () => true : (url: string) => !url.includes('video_thumb')

const buildFilePathMaker =
  (filenameUsecase: V4FilenameSettingsUsecase) =>
  (tweetDetail: TweetDetail) =>
  (mediaFile: ITweetMediaFileDetail) => {
    const filename = filenameUsecase.makeFilename(tweetDetail, {
      serial: mediaFile.order,
      hash: mediaFile.hashName,
      date: new Date(),
    })
    const fileFullPath = filenameUsecase.makeFullPathWithFilenameAndExt(
      filename,
      mediaFile.ext,
      filenameUsecase.makeAggregationDirectory(tweetDetail)
    )
    return fileFullPath
  }
