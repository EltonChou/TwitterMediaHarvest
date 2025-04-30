/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
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
  tweetIds?: Set<string>
}

export type SearchDownloadHistory = AsyncUseCase<Query, QueryResult>
