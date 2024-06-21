import type { IDownloadRepository } from '#domain/repositories/download'
import type { IUsageStatisticsRepository } from '#domain/repositories/usageStatistics'
import type { AsyncUseCase } from './base'
import { isNonEmpty } from 'fp-ts/lib/Array'
import type { Downloads } from 'webextension-polyfill'

type CheckDownloadWasTriggeredBySelffCommand = {
  downloadId: Downloads.DownloadItem['id']
}

export class CheckDownloadWasTriggeredBySelf
  implements AsyncUseCase<CheckDownloadWasTriggeredBySelffCommand, boolean>
{
  constructor(
    readonly extensionId: string,
    readonly usageStatisticsRepo: IUsageStatisticsRepository,
    readonly downloadRepository: IDownloadRepository<
      Downloads.DownloadQuery,
      Downloads.DownloadItem
    >
  ) {}

  private isSameExtension(downloadItem: Downloads.DownloadItem): boolean {
    return downloadItem.byExtensionId === this.extensionId
  }

  async process(command: CheckDownloadWasTriggeredBySelffCommand): Promise<boolean> {
    const items = (
      await this.downloadRepository.search({ id: command.downloadId })
    ).filter(item => this.isSameExtension(item) && isNotJson(item))

    return isNonEmpty(items)
  }
}

const isNotJson = (downloadItem: Downloads.DownloadItem): boolean =>
  downloadItem?.mime !== 'application/json'
