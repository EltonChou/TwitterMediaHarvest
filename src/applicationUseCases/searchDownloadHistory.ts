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

export type QueryResult =
  | {
      items: DownloadHistoryInfo[]
      matchedCount: number
      error: undefined
    }
  | {
      items: []
      matchedCount: -1
      error: Error
    }

export class SearchDownloadHistoryUseCase implements AsyncUseCase<Query, QueryResult> {
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

  async process(query: Query): Promise<QueryResult> {
    const { value: tweetIds, error: tweetIdsError } = await this.searchTweetIds(
      query.hashtags
    )
    if (tweetIdsError) return toErrorQueryResult(tweetIdsError)

    const userNameFilter: Filter =
      query.filter.userName === '*'
        ? () => true
        : ({ screenName, displayName }) =>
            [screenName, displayName].some(name => name.includes(query.filter.userName))

    const mediaTypeFilter: Filter =
      query.filter.mediaType === '*'
        ? () => true
        : ({ mediaType }) => mediaType === query.filter.mediaType

    const result = await this.searchDownloadHistory.process({
      tweetIds: tweetIds,
      limit: query.itemPerPage,
      skip: calcSkip(query),
      filters: [userNameFilter, mediaTypeFilter],
      orderBy: {
        key: 'downloadTime',
        type: 'desc',
      },
    })

    if (result.error) return toErrorQueryResult(result.error)

    return {
      error: undefined,
      items: result.items.map(downloadHistoryToInfo),
      matchedCount: result.matchedCount,
    }
  }
}

const toErrorQueryResult = (error: Error): QueryResult => ({
  error: error,
  items: [],
  matchedCount: -1,
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
