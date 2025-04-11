/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import type { DownloadHistory } from '#domain/entities/downloadHistory'
import type { Factory } from '#domain/factories/base'
import type { SearchDownloadHistory } from '#domain/useCases/searchDownloadHistory'
import type { Filter } from '#domain/useCases/searchDownloadHistory'
import type { SearchTweetIdsByHashTags } from '#domain/useCases/searchTweetIdsByHashtags'
import type { DownloadHistoryTweetUser } from '#domain/valueObjects/downloadHistoryTweetUser'
import type MediaType from '#enums/mediaType'
import { isErrorResult, toSuccessResult } from '#utils/result'
import type { AsyncUseCase } from '../domain/useCases/base'

export type User = {
  id: string
  displayName: string
  screenName: string
}

export type DownloadHistoryInfo = {
  id: string
  user: User
  mediaType: MediaType
  thumbnail?: string
  hashtags: string[]

  tweetTime: Date
  downloadTime: Date
}

export type Query = {
  page: number
  itemPerPage: number
  filter: {
    userName: '*' | string
    mediaType: '*' | MediaType
  }
  hashtags: string[]
}

interface QueryMetadata {
  page: {
    total: number
    prev: number | null
    current: number
    next: number | null
  }
  itemPerPage: number
  matchedCount: number
}

export interface DownloadHistoryQueryResponse {
  $metadata: QueryMetadata
  result: QueryResult
}

type QueryResult =
  | {
      items: DownloadHistoryInfo[]
      error: undefined
    }
  | {
      items: []
      error: Error
    }

export class SearchDownloadHistoryUseCase
  implements AsyncUseCase<Query, DownloadHistoryQueryResponse>
{
  constructor(
    readonly searchDownloadHistory: SearchDownloadHistory,
    readonly searchTweetIdsByHashtags: SearchTweetIdsByHashTags
  ) {}

  async searchTweetIds(hashtags: string[]): AsyncResult<Set<string>> {
    return hashtags.length === 0
      ? toSuccessResult(new Set())
      : this.searchTweetIdsByHashtags.process({
          hashtags: hashtags,
        })
  }

  async process(query: Query): Promise<DownloadHistoryQueryResponse> {
    const itemPerPage = Math.abs(query.itemPerPage)
    const currentPage = Math.max(1, Math.abs(query.page))

    const toErrorResponse = (error: Error): DownloadHistoryQueryResponse => ({
      $metadata: {
        itemPerPage,
        page: {
          total: 1,
          prev: null,
          current: currentPage,
          next: null,
        },
        matchedCount: 0,
      },
      result: toErrorQueryResult(error),
    })

    const idSearchResult = await this.searchTweetIds(query.hashtags)
    if (isErrorResult(idSearchResult))
      return toErrorResponse(idSearchResult.error)

    const result = await this.searchDownloadHistory.process({
      tweetIds: idSearchResult.value,
      limit: itemPerPage,
      skip: calcSkip(query),
      filters: [
        makeUserNameFilter(query.filter.userName),
        makeMediaTypeFilter(query.filter.mediaType),
      ],
      orderBy: {
        key: 'downloadTime',
        type: 'desc',
      },
    })
    if (result.error) return toErrorResponse(result.error)

    const getTotalPage = (matchedCount: number) =>
      Math.max(1, Math.ceil(matchedCount / itemPerPage))
    const getPrevPage = () => (currentPage > 1 ? currentPage - 1 : null)
    const getNextPage = (matchedCount: number) =>
      currentPage * itemPerPage >= matchedCount ? null : currentPage + 1

    return {
      $metadata: {
        itemPerPage,
        page: {
          total: getTotalPage(result.matchedCount),
          prev: getPrevPage(),
          current: currentPage,
          next: getNextPage(result.matchedCount),
        },
        matchedCount: result.matchedCount,
      },
      result: {
        items: result.items.map(downloadHistoryToInfo),
        error: undefined,
      },
    }
  }
}

const toErrorQueryResult = (error: Error): QueryResult => ({
  items: [],
  error: error,
})

const calcSkip = (query: Query): number =>
  Math.max(0, query.page - 1) * query.itemPerPage

const tweetUserToUser: Factory<DownloadHistoryTweetUser, User> = tweetUser =>
  tweetUser.mapBy(props => ({
    id: props.userId,
    screenName: props.screenName,
    displayName: props.displayName,
  }))

const downloadHistoryToInfo: Factory<
  DownloadHistory,
  DownloadHistoryInfo
> = downloadHistory =>
  downloadHistory.mapBy((id, props) => ({
    user: tweetUserToUser(props.tweetUser),
    hashtags: props.hashtags,
    thumbnail: props.thumbnail,
    downloadTime: props.downloadTime,
    tweetTime: props.tweetTime,
    mediaType: props.mediaType,
    id: id.value,
  }))

const makeMediaTypeFilter = (expectedMediaType: MediaType | '*'): Filter =>
  expectedMediaType === '*'
    ? () => true
    : ({ mediaType }) => mediaType === expectedMediaType

const makeUserNameFilter = (userName: string): Filter => {
  const lowerCaseSearchName = userName.toLowerCase()
  return userName === '*'
    ? () => true
    : ({ screenName, displayName }) =>
        [screenName, displayName].some(name =>
          name.toLowerCase().includes(lowerCaseSearchName)
        )
}
