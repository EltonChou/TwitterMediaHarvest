import { downloadRecordRepo } from '../configurations'
import { IDownloadRecordsRepository } from '../downloads/repositories'
import DownloadRecordUseCase from '@backend/downloads/useCases/downloadRecordUseCase'
import browser from 'webextension-polyfill'

interface INotificationUseCase {
  handleClose(): Promise<void>
  handleClick(): Promise<void>
  handleButton(buttonIndex: number): Promise<void>
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
      downloadRecordRepo
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

  async handleClose(): Promise<void> {
    await this.useCase.handleClose()
  }

  async handleClick(): Promise<void> {
    await this.useCase.handleClick()
  }

  async handleButton(buttonIndex: number): Promise<void> {
    await this.useCase.handleButton(buttonIndex)
  }
}

const tweetUrl = (tweetId: string) => `https://twitter.com/i/web/status/${tweetId}`

class NullNotificationUseCase implements INotificationUseCase {
  async handleButton(buttonIndex: number): Promise<void> {
    return
  }

  async handleClick(): Promise<void> {
    return
  }

  async handleClose(): Promise<void> {
    return
  }
}

class DownloadNotificationUseCase implements INotificationUseCase {
  constructor(
    readonly downloadItemId: number,
    private downloadRecordRepo: IDownloadRecordsRepository
  ) {}

  async handleButton(buttonIndex: number): Promise<void> {
    if (buttonIndex === 0) await this.openFailedTweetInNewTab()
    if (buttonIndex === 1) await this.retryDownload()
  }

  async handleClick(): Promise<void> {
    await this.openFailedTweetInNewTab()
  }

  async handleClose(): Promise<void> {
    await this.downloadRecordRepo.removeById(this.downloadItemId)
  }

  async openFailedTweetInNewTab(): Promise<void> {
    const { tweetInfo } = await this.downloadRecordRepo.getById(this.downloadItemId)
    await this.downloadRecordRepo.removeById(this.downloadItemId)
    browser.tabs.create({ url: tweetUrl(tweetInfo.tweetId) })
  }

  async retryDownload(): Promise<void> {
    const recordUseCase = new DownloadRecordUseCase(this.downloadRecordRepo)
    await recordUseCase.retryByDownloadId(this.downloadItemId)
  }

  static valid_id(notificationId: string): boolean {
    return Boolean(notificationId.match(DownloadFailedIdPattern))
  }
}

class FetchErrorNotificationUseCase implements INotificationUseCase {
  constructor(private readonly tweetId: string) {}

  async handleButton(buttonIndex: number): Promise<void> {
    if (buttonIndex === 0) await this.openFailedTweetInNewTab()
  }

  async handleClick(): Promise<void> {
    await this.openFailedTweetInNewTab()
  }

  async handleClose(): Promise<void> {
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
