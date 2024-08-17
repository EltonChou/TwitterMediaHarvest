import type { DownloadConfig } from '#domain/valueObjects/downloadConfig'
import type { AsyncUseCase } from './base'

export type DownloadFileCommand = {
  target: DownloadConfig
}

export type DownloadFileUseCase = AsyncUseCase<DownloadFileCommand, UnsafeTask>
