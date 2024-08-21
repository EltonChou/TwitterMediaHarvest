import type { DownloadItemRecorder } from './downloadItemRecorder'
import { downloadItemRecorder } from './downloadItemRecorder'
import { IDownloadRecordsRepository } from './repositories'
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
    readonly featureSettings: FeatureSettings,
    readonly downloadRecordRepo: IDownloadRecordsRepository
  ) {}

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
      const recordConfig = downloadItemRecorder(this.downloadRecordRepo)({
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

      Array.from(mediaCatalog.videos).forEach(download)

      Array.from(mediaCatalog.images)
        .filter(shouldAllowThumbnail(this.featureSettings.includeVideoThumbnail))
        .forEach(({ url }, index) => download(url, index))
    }
  }
}

const shouldAllowThumbnail = (allow: boolean) =>
  allow ? () => true : (image: TweetImage) => image._type === 'normal'

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
