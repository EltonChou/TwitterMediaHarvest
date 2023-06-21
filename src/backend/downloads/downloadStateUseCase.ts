import { addBreadcrumb } from '@sentry/browser'
import type { Downloads } from 'webextension-polyfill'
import Browser from 'webextension-polyfill'
import { storageConfig } from '../configurations'
import { DownwloadFailedNotificationUseCase } from '../notifications/notifyUseCase'
import { V4StatsUseCase } from '../statistics/useCases'
import InterruptReason from './InterruptReason'
import { IDownloadRecordsRepository } from './repository'
import { downloadIsCompleted, downloadIsInterrupted } from './utils/downloadState'

const statisticsUseCase = new V4StatsUseCase(storageConfig.statisticsRepo)

export default class DownloadStateUseCase {
  constructor(
    readonly downloadDelta: Downloads.OnChangedDownloadDeltaType,
    private downloadRecordRepo: IDownloadRecordsRepository
  ) {}

  async process(): Promise<void> {
    if (downloadIsInterrupted(this.downloadDelta.state)) await this.handle_interrupted()
    if (downloadIsCompleted(this.downloadDelta.state)) await this.handle_completed()
  }

  async handle_interrupted(): Promise<void> {
    // eslint-disable-next-line no-console
    const { id, error } = this.downloadDelta
    console.log('Download was interrupted.', this.downloadDelta)
    addBreadcrumb({
      category: 'download',
      message: `Download interupted reason. (current: ${error.current}, previous: ${error.previous})`,
      level: 'info',
    })

    // If download was canceled by user (file location asking), remove the record and don't notify.
    if (error.current === InterruptReason.UserCancel) {
      await this.downloadRecordRepo.removeById(this.downloadDelta.id)
      return
    }

    const downloadRecord = await this.downloadRecordRepo.getById(id)
    if (downloadRecord) {
      const { tweetInfo } = downloadRecord
      if (tweetInfo) {
        const notifyUseCase = new DownwloadFailedNotificationUseCase(tweetInfo)
        notifyUseCase.notify(this.downloadDelta)
      }
    }
  }

  async handle_completed(): Promise<void> {
    // eslint-disable-next-line no-console
    console.log('Download was completed.', this.downloadDelta)
    const [item] = await Browser.downloads.search({ id: this.downloadDelta.id })
    if (item) await statisticsUseCase.addTraffic(item.fileSize)
    await statisticsUseCase.addDownloadCount()
    await this.downloadRecordRepo.removeById(this.downloadDelta.id)
  }
}
