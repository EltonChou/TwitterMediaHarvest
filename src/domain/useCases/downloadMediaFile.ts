import type { DownloadTarget } from '#domain/valueObjects/downloadTarget'
import type { AsyncUseCase } from './base'

export type DownloadMediaFileCommand = {
  target: DownloadTarget
}

export interface DownloadMediaFileUseCase
  extends AsyncUseCase<DownloadMediaFileCommand, number>,
    DomainEventSource {}

export type ThirdPartyDownloadMediaFileUseCase = AsyncUseCase<
  DownloadMediaFileCommand,
  void
>
