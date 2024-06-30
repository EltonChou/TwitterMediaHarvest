import type { IDownloadRepository } from '#domain/repositories/download'
import type { AsyncUseCase } from './base'
import { isNonEmpty } from 'fp-ts/lib/Array'

type CheckDownloadWasTriggeredBySelfCommand = {
  downloadId: DownloadQuery['id']
}

type DownloadQuery = {
  id: number
}

type DownloadItem = {
  byExtensionId?: string
  mime?: string
}

export class CheckDownloadWasTriggeredBySelf
  implements AsyncUseCase<CheckDownloadWasTriggeredBySelfCommand, boolean>
{
  constructor(
    readonly extensionId: string,
    readonly downloadRepository: IDownloadRepository<DownloadQuery, DownloadItem>
  ) {}

  private isSameExtension(downloadItem: DownloadItem): boolean {
    return downloadItem.byExtensionId === this.extensionId
  }

  async process(command: CheckDownloadWasTriggeredBySelfCommand): Promise<boolean> {
    const items = (
      await this.downloadRepository.search({ id: command.downloadId })
    ).filter(item => this.isSameExtension(item) && isNotJson(item))

    return isNonEmpty(items)
  }
}

const isNotJson = (downloadItem: DownloadItem): boolean =>
  downloadItem?.mime !== 'application/json'
