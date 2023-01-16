import { StorageAreaDownloadRecordsRepository } from '../downloadRecords/repository'
import { IDownloadRecordsRepository } from '../downloadRecords/repository'
import { downloadItemRecorder } from '../downloads/downloadItemRecorder'


interface INotificationUseCase {
  handle_close(): Promise<void>
  handle_click(): Promise<void>
  handle_button(buttonIndex: number): Promise<void>
}


const FetchErrorIdPattern = /^tweet_(\d+)/
const DownloadFailedIdPattern = /^download_(\d+)/


function checkUseCase(notificationId: string): INotificationUseCase {
  if (notificationId.match(FetchErrorIdPattern)) {
    return new FetchErrorNotificationUseCase(
      notifficationIdToTweetId(notificationId)
    )
  }
  if (notificationId.match(DownloadFailedIdPattern)) {
    const downloadRecordRepo = new StorageAreaDownloadRecordsRepository(chrome.storage.local)
    return new DownloadNotificationUseCase(
      notificationIdToDownloadItemId(notificationId),
      downloadRecordRepo
    )
  }
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

class DownloadNotificationUseCase implements INotificationUseCase {
  readonly downloadRecordRepo: IDownloadRecordsRepository
  private downloadItemId: number

  constructor(downloadItemId: number, downloadRecordRepo: IDownloadRecordsRepository) {
    this.downloadItemId = downloadItemId
    this.downloadRecordRepo = downloadRecordRepo
  }

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
    chrome.tabs.create({ url: tweetUrl(tweetInfo.tweetId) })
  }

  async retryDownload(): Promise<void> {
    const { tweetInfo, downloadConfig } = await this.downloadRecordRepo.getById(this.downloadItemId)
    await this.downloadRecordRepo.removeById(this.downloadItemId)
    const downloadRecorder = downloadItemRecorder(tweetInfo)(downloadConfig)
    chrome.downloads.download(downloadConfig, downloadRecorder)
  }
}


class FetchErrorNotificationUseCase implements INotificationUseCase {
  private tweetId: string

  constructor(tweetId: string) {
    this.tweetId = tweetId
  }

  async handle_button(buttonIndex: number): Promise<void> {
    if (buttonIndex === 0) await this.openFailedTweetInNewTab()
  }

  async handle_click(): Promise<void> {
    await this.openFailedTweetInNewTab()
  }

  async handle_close(): Promise<void> { /*pass*/ }


  async openFailedTweetInNewTab(): Promise<void> {
    chrome.tabs.create({ url: tweetUrl(this.tweetId) })
  }
}


function notifficationIdToTweetId(notificationId: string): string {
  return notificationId.match(DownloadFailedIdPattern)[1]
}

function notificationIdToDownloadItemId(notificationId: string): number {
  return Number(notificationId.match(DownloadFailedIdPattern)[1])
}
