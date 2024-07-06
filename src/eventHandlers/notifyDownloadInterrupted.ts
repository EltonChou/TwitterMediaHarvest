import type { DomainEventHandler } from '#domain/eventPublisher'
import type { Notifier } from '#domain/notifier'
import type { IDownloadRecordRepository } from '#domain/repositories/downloadRecord'
import InterruptReason from '#enums/InterruptReason'
import { MediaDownloadNotificationConfig } from '#helpers/notificationConfig'
import { makeDownloadFailedNotificationId } from '#helpers/notificationId'
import type { Notifications } from 'webextension-polyfill'

export const notifyDownloadInterrupted =
  (
    notifier: Notifier<Notifications.CreateNotificationOptions>,
    downloadRecordRepo: IDownloadRecordRepository
  ): DomainEventHandler<DownloadInterruptedEvent> =>
  async event => {
    // TODO: Should we ignore `USER_SHUTDOWN`?
    if (event.reason === InterruptReason.UserCancel) return

    // eslint-disable-next-line no-console
    console.log('Download was interrupted. Reason:', event.reason)

    // TODO: Monitoring agent.
    // addBreadcrumb({
    //   category: 'download',
    //   message: 'Download interupted reason.',
    //   level: 'info',
    //   data: error,
    // })

    const downloadRecord = await downloadRecordRepo.getById(event.downloadId)
    if (!downloadRecord) return

    const tweetInfo = downloadRecord.mapBy(props => props.tweetInfo).mapBy(props => props)
    const notificationConfig = MediaDownloadNotificationConfig.error(
      tweetInfo,
      event.occuredAt
    )

    await notifier.notify(
      makeDownloadFailedNotificationId(event.downloadId),
      notificationConfig
    )
  }