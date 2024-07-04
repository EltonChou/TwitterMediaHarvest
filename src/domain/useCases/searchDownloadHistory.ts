import { DownloadHistory } from '#domain/entities/downloadHistory'
import type { AsyncUseCase } from './base'

type QueryResult = {
  items: DownloadHistory[]
  matchedCount: number
}

type Query = {
  limit?: number
  skip?: number
  predicates: (item: DownloadHistory) => boolean
}

export type SearchDownloadHistoryUseCase = AsyncUseCase<Query, QueryResult>
