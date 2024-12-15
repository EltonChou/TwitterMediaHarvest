import type { DownloadHistory } from '#domain/entities/downloadHistory'
import type { Factory } from '#domain/factories/base'
import type { SearchDownloadHistory } from '#domain/useCases/searchDownloadHistory'
import type { Filter } from '#domain/useCases/searchDownloadHistory'
import type { SearchTweetIdsByHashTags } from '#domain/useCases/searchTweetIdsByHashtags'
import type { TweetUser } from '#domain/valueObjects/tweetUser'
import type MediaType from '#enums/mediaType'
import { toErrorResult, toSuccessResult } from '#utils/result'
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
    if (hashtags.length === 0) return toSuccessResult(new Set<string>())

    const { value: tweetIds, error } = await this.searchTweetIdsByHashtags.process({
      hashtags: hashtags,
    })

    if (error) return toErrorResult(error)
    return toSuccessResult(tweetIds)
  }

  async process(query: Query): Promise<DownloadHistoryQueryResponse> {
    const { value: tweetIds, error: tweetIdsError } = await this.searchTweetIds(
      query.hashtags
    )

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

    if (tweetIdsError) return toErrorResponse(tweetIdsError)

    const result = await this.searchDownloadHistory.process({
      tweetIds: tweetIds,
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

    return {
      $metadata: {
        itemPerPage,
        page: {
          total: Math.ceil(result.matchedCount / itemPerPage),
          prev: currentPage > 1 ? currentPage - 1 : null,
          current: currentPage,
          next: currentPage * itemPerPage >= result.matchedCount ? null : currentPage + 1,
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

const calcSkip = (query: Query): number => Math.max(0, query.page - 1) * query.itemPerPage

const tweetUserToUser: Factory<TweetUser, User> = tweetUser =>
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

const makeMediaTypeFilter = (mediaType: MediaType | '*'): Filter =>
  mediaType === '*' ? () => true : ({ mediaType }) => mediaType === mediaType

const makeUserNameFilter = (userName: string): Filter =>
  userName === '*'
    ? () => true
    : ({ screenName, displayName }) =>
        [screenName, displayName].some(name => name.includes(userName))
