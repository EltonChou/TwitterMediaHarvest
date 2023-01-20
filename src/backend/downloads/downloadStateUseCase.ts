import * as Sentry from '@sentry/browser'
import { downloadIsCompleted, downloadIsInterrupted } from './utils/downloadState'
import { IDownloadRecordsRepository } from '../downloadRecords/repository'
import StatisticsUseCases from '../statistics/useCases'
import { DownwloadFailedNotificationUseCase } from '../notifications/notifyUseCase'
import StatisticsRepository from '../statistics/repositories'

const statisticsUseCase = new StatisticsUseCases(new StatisticsRepository(chrome.storage.local))

export default class DownloadStateUseCase {
  readonly downloadDelta: chrome.downloads.DownloadDelta
  private downloadRecordRepo: IDownloadRecordsRepository

  constructor(
    downloadDelta: chrome.downloads.DownloadDelta,
    downloadRecordRepo: IDownloadRecordsRepository
  ) {
    this.downloadDelta = downloadDelta
    this.downloadRecordRepo = downloadRecordRepo
  }

  async process(): Promise<void> {
    if (downloadIsInterrupted(this.downloadDelta.state)) await this.handle_interrupted()
    if (downloadIsCompleted(this.downloadDelta.state)) await this.handle_completed()
  }

  async handle_interrupted(): Promise<void> {
    // eslint-disable-next-line no-console
    console.log('Download was interrupted.', this.downloadDelta)
    const { id, error } = this.downloadDelta
    await statisticsUseCase.addFailedDownloadCount()

    const downloadRecord = await this.downloadRecordRepo.getById(id)
    if (downloadRecord) {
      Sentry.addBreadcrumb({
        category: 'download',
        message: `Download interupted reason. (current: ${error.current}, previous: ${error.previous})`,
        level: 'info',
      })
      Sentry.captureMessage(
        `Download interupted reason. (current: ${error.current}, previous: ${error.previous})`
      )
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
    await statisticsUseCase.addSuccessDownloadCount()
    await this.downloadRecordRepo.removeById(this.downloadDelta.id)
  }
}
