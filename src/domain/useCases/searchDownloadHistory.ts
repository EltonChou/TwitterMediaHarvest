import { DownloadHistory } from '#domain/entities/downloadHistory'
import MediaType from '#enums/mediaType'
import type { AsyncUseCase } from './base'

type QueryResult =
  | {
      items: DownloadHistory[]
      matchedCount: number
      error: undefined
    }
  | {
      items: []
      matchedCount: -1
      error: Error
    }

type Filter = (item: {
  screenName?: string
  displayName?: string
  mediaType?: MediaType
}) => boolean

type Query = {
  limit: number
  skip: number
  filters: Filter[]
  hashtags: string[]
}

export type SearchDownloadHistoryUseCase = AsyncUseCase<Query, QueryResult>
