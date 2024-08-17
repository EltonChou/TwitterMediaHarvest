import type {
  DownloadFileCommand,
  DownloadFileUseCase,
} from '#domain/useCases/downloadFile'
import type { DownloadConfig } from '#domain/valueObjects/downloadConfig'
import { isFirefox } from '#helpers/runtime'
import { toError } from 'fp-ts/lib/Either'
import Browser from 'webextension-polyfill'

export class BrowserDownloadFile implements DownloadFileUseCase {
  async process(command: DownloadFileCommand): Promise<UnsafeTask> {
    const downloadId = await Browser.downloads.download(
      downloadConfigToBrowserDownloadOptions(command.target)
    )

    if (!downloadId) return toError(Browser.runtime.lastError)
  }
}

const downloadConfigToBrowserDownloadOptions = (
  config: DownloadConfig
): Browser.Downloads.DownloadOptionsType =>
  config.mapBy(props => ({
    filename: props.filename,
    conflictAction: props.conflictAction,
    url: props.url,
    ...(isFirefox() ? { saveAs: props.saveAs } : {}),
  }))
