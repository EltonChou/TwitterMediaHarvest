import browser from 'webextension-polyfill'
import { storageConfig } from '../configurations'
import { downloadItemRecorder } from '../downloads/downloadItemRecorder'
import { IDownloadRecordsRepository } from '../downloads/repositories'

interface INotificationUseCase {
  handle_close(): Promise<void>
  handle_click(): Promise<void>
  handle_button(buttonIndex: number): Promise<void>
}

const FetchErrorIdPattern = /^tweet_(\d+)/
const DownloadFailedIdPattern = /^download_(\d+)/

function checkUseCase(notificationId: string): INotificationUseCase {
  if (FetchErrorNotificationUseCase.valid_id(notificationId)) {
    return new FetchErrorNotificationUseCase(notifficationIdToTweetId(notificationId))
  }
  if (DownloadNotificationUseCase.valid_id(notificationId)) {
    return new DownloadNotificationUseCase(
      notificationIdToDownloadItemId(notificationId),
      storageConfig.downloadRecordRepo
    )
  }

  return new NullNotificationUseCase()
}

export default class NotificationUseCase implements INotificationUseCase {
  public notificationId: string
  private useCase: INotificationUseCase

  constructor(notificationId: string) {
    this.notificationId = notificationId
    this.useCase = checkUseCase(notificationId)
  }

  async handle_close(): Promise<void> {
    await this.useCase.handle_close()
  }

  async handle_click(): Promise<void> {
    await this.useCase.handle_click()
  }

  async handle_button(buttonIndex: number): Promise<void> {
    await this.useCase.handle_button(buttonIndex)
  }
}

const tweetUrl = (tweetId: string) => `https://twitter.com/i/web/status/${tweetId}`

class NullNotificationUseCase implements INotificationUseCase {
  async handle_button(buttonIndex: number): Promise<void> {
    return
  }

  async handle_click(): Promise<void> {
    return
  }

  async handle_close(): Promise<void> {
    return
  }
}

class DownloadNotificationUseCase implements INotificationUseCase {
  constructor(readonly downloadItemId: number, private downloadRecordRepo: IDownloadRecordsRepository) {}

  async handle_button(buttonIndex: number): Promise<void> {
    if (buttonIndex === 0) await this.openFailedTweetInNewTab()
    if (buttonIndex === 1) await this.retryDownload()
  }

  async handle_click(): Promise<void> {
    await this.openFailedTweetInNewTab()
  }

  async handle_close(): Promise<void> {
    await this.downloadRecordRepo.removeById(this.downloadItemId)
  }

  async openFailedTweetInNewTab(): Promise<void> {
    const { tweetInfo } = await this.downloadRecordRepo.getById(this.downloadItemId)
    await this.downloadRecordRepo.removeById(this.downloadItemId)
    browser.tabs.create({ url: tweetUrl(tweetInfo.tweetId) })
  }

  async retryDownload(): Promise<void> {
    const { tweetInfo, downloadConfig } = await this.downloadRecordRepo.getById(this.downloadItemId)
    await this.downloadRecordRepo.removeById(this.downloadItemId)
    const downloadRecorder = downloadItemRecorder(tweetInfo)(downloadConfig)
    const downloadId = await browser.downloads.download(downloadConfig)
    downloadRecorder(downloadId)
  }

  static valid_id(notificationId: string): boolean {
    return Boolean(notificationId.match(DownloadFailedIdPattern))
  }
}

class FetchErrorNotificationUseCase implements INotificationUseCase {
  constructor(private readonly tweetId: string) {}

  async handle_button(buttonIndex: number): Promise<void> {
    if (buttonIndex === 0) await this.openFailedTweetInNewTab()
  }

  async handle_click(): Promise<void> {
    await this.openFailedTweetInNewTab()
  }

  async handle_close(): Promise<void> {
    /*pass*/
  }

  async openFailedTweetInNewTab(): Promise<void> {
    browser.tabs.create({ url: tweetUrl(this.tweetId) })
  }

  static valid_id(notificationId: string): boolean {
    return Boolean(notificationId.match(FetchErrorIdPattern))
  }
}

function notifficationIdToTweetId(notificationId: string): string {
  return notificationId.match(FetchErrorIdPattern)[1]
}

function notificationIdToDownloadItemId(notificationId: string): number {
  return Number(notificationId.match(DownloadFailedIdPattern)[1])
}
