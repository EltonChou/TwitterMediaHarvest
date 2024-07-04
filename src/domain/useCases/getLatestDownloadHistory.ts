import { DownloadHistory } from '#domain/entities/downloadHistory'
import type { AsyncUseCase } from './base'

type GetLatestDownloadHistoryCommand = {
  count: number
}

export type GetLatestDownloadHistory = AsyncUseCase<
  GetLatestDownloadHistoryCommand,
  DownloadHistory
>
