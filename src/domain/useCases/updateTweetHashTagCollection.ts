import type { DownloadHistory } from '#domain/entities/downloadHistory'
import type { AsyncUseCase } from './base'

type UpdateTweetHashTagCollectionCommand = {
  operation: 'add' | 'remove'
  target: DownloadHistory
}

export type UpdateTweetHashTagCollection = AsyncUseCase<
  UpdateTweetHashTagCollectionCommand,
  void
>
