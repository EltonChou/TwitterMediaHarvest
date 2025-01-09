import type { DomainEventHandler } from '#domain/eventPublisher'
import type { IDownloadRecordRepository } from '#domain/repositories/downloadRecord'
import type { ISettingsRepository } from '#domain/repositories/settings'
import type { DownloadMediaFileUseCaseBuilder } from '#domain/useCases/downloadMediaFile'
import type { DownloadSettings } from '#schema'

export const retryFailedDownload =
  (
    downloadSettingsRepo: ISettingsRepository<DownloadSettings>,
    recordRepo: IDownloadRecordRepository,
    buildDownloader: DownloadMediaFileUseCaseBuilder
  ): DomainEventHandler<DownloadFailedNotificationEvent> =>
  async (event, publisher) => {
    const { value: record, error } = await recordRepo.getById(event.downloadId)
    if (error) return

    const { tweetInfo, downloadConfig } = record.mapBy(props => ({
      tweetInfo: props.tweetInfo,
      downloadConfig: props.downloadConfig,
    }))

    const downloadSettings = await downloadSettingsRepo.get()
    const downloader = buildDownloader({
      shouldPrompt: downloadSettings.askWhereToSave,
      targetTweet: tweetInfo,
    })
    await downloader.process({ target: downloadConfig })
    if (publisher) await publisher.publishAll(...downloader.events)
  }
