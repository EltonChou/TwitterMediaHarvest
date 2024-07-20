import type { DownloadHistory } from '#domain/entities/downloadHistory'
import type { AsyncUseCase } from '#domain/useCases/base'
import type MediaType from '#enums/mediaType'

export type QueryResult =
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

export type Filter = (item: {
  tweetId: string
  screenName: string
  displayName: string
  mediaType: MediaType
}) => boolean

export type OrderCriteria = {
  type: 'desc' | 'asc'
  key: 'tweetTime' | 'downloadTime'
}

export type Query = {
  limit: number
  skip: number
  filters: Filter[]
  orderBy: OrderCriteria
  tweetIdRange?: Set<string>
}

export type SearchDownloadHistoryUseCase = AsyncUseCase<Query, QueryResult>
