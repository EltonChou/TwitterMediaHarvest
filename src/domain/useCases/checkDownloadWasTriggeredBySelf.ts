import type { DownloadItem } from '#domain/repositories/download'
import type { UseCase } from './base'

type CheckDownloadWasTriggeredBySelfCommand = {
  item: DownloadItem
}

export class CheckDownloadWasTriggeredBySelf
  implements UseCase<CheckDownloadWasTriggeredBySelfCommand, boolean>
{
  constructor(readonly extensionId: string) {}

  private isSameExtension(downloadItem: DownloadItem): boolean {
    return downloadItem.byExtensionId === this.extensionId
  }

  /**
   * Only focus on files were downloaded from twitter.
   * In the future, we might export some data to user and most of them would be json file.
   */
  process(command: CheckDownloadWasTriggeredBySelfCommand): boolean {
    return this.isSameExtension(command.item) && isNotJson(command.item)
  }
}

const isNotJson = (downloadItem: DownloadItem): boolean =>
  downloadItem?.mime !== 'application/json'
