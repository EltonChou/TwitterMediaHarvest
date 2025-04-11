/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import type { IDownloadHistoryRepository } from '#domain/repositories/downloadHistory'
import type { IPortableDownloadHistoryRepository } from '#domain/repositories/portableDownloadHistory'
import {
  V5JsonSchema,
  V5PortableHistory,
} from '#domain/valueObjects/portableDownloadHistory'
import { V5PortableDownloadHistoryItemProps } from '#domain/valueObjects/portableDownloadHistoryItem'
import MediaType from '#enums/mediaType'
import { toErrorResult, toSuccessResult } from '#utils/result'
import type { ObjectUrl } from '#utils/url'
import type {
  DownloadHistoryInfo,
  DownloadHistoryQueryResponse,
  Query,
} from '../../applicationUseCases/searchDownloadHistory'
import { SearchDownloadHistoryUseCase } from '../../applicationUseCases/searchDownloadHistory'
import { v5PortableDownloadHistoryToDownloadHistories } from '../../mappers/portableDownloadHistory'
import { toError } from 'fp-ts/lib/Either'
import Joi from 'joi'
import { useCallback, useEffect, useState } from 'react'
import semver from 'semver'

export type DownloadHistoryItem = DownloadHistoryInfo
export class PortableHistoryFormatError extends Error {}

interface WithCallbacks {
  cbs: Callback[]
}

export type DownloadHistoryHook = {
  info: {
    isLoaded: boolean
    hasNextPage: boolean
    hasPrevPage: boolean
    total: number
    totalPages: number
    currentPage: number
  }
  handler: {
    search: (query: SearchQuery, option?: WithCallbacks) => void
    refresh: (option?: WithCallbacks) => void
    import: (
      data: ArrayBuffer | string
    ) => Promise<UnsafeTask<PortableHistoryFormatError>>
    /**
     * @returns Object url of history file
     */
    export: () => Promise<Result<ObjectUrl>>
    clear: () => Promise<UnsafeTask>
    deleteItemById: (id: string) => Promise<UnsafeTask>
  }
  items: DownloadHistoryInfo[]
  pageHandler: {
    setItemPerPage: (count: number, options?: WithCallbacks) => void
    nextPage: (option?: WithCallbacks) => void
    prevPage: (option?: WithCallbacks) => void
    specifyPage: (page: number, option?: WithCallbacks) => void
  }
}

type Callback = () => void

type PageInfo = {
  total: number
  prev: number | null
  current: number
  next: number | null
}

export type SearchQuery = Pick<Query, 'filter' | 'hashtags'>
const DEFAULT_QUERY = Object.freeze<SearchQuery>({
  filter: { mediaType: '*', userName: '*' },
  hashtags: [],
})

type UseDownloadHistoryProps = {
  initItemPerPage: number
  searchDownloadHistoryUseCase: SearchDownloadHistoryUseCase
  portableDownloadHistoryRepo: IPortableDownloadHistoryRepository
  downloadHistoryRepo: IDownloadHistoryRepository
}

const useDownloadHistory = ({
  searchDownloadHistoryUseCase,
  initItemPerPage,
  portableDownloadHistoryRepo,
  downloadHistoryRepo,
}: UseDownloadHistoryProps): DownloadHistoryHook => {
  const [items, setItems] = useState<DownloadHistoryInfo[]>([])
  const [query, setQuery] = useState<SearchQuery>(DEFAULT_QUERY)
  const [pageInfo, setPageInfo] = useState<PageInfo>({
    prev: null,
    current: 1,
    next: null,
    total: 1,
  })
  const [itemPerPage, setItemPerPage] = useState(initItemPerPage)
  const [isLoaded, setLoaded] = useState(false)
  const [total, setTotal] = useState(0)

  const setResultByResponse = useCallback(
    (resp: DownloadHistoryQueryResponse) => {
      setItems(resp.result.items)
      setTotal(resp.$metadata.matchedCount)
      setPageInfo(resp.$metadata.page)
    },
    []
  )

  const loadLatest = useCallback(
    async ({
      itemPerPage,
      query,
    }: {
      itemPerPage: number
      query: SearchQuery
    }) => {
      const resp = await searchDownloadHistoryUseCase.process({
        ...query,
        itemPerPage: itemPerPage,
        page: 1,
      })

      return setResultByResponse(resp)
    },
    [setResultByResponse, searchDownloadHistoryUseCase]
  )

  useEffect(() => {
    loadLatest({ itemPerPage, query }).then(() => {
      setLoaded(true)
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const prevPage: DownloadHistoryHook['pageHandler']['prevPage'] = useCallback(
    options => {
      if (pageInfo.prev === null) return
      searchDownloadHistoryUseCase
        .process({
          filter: query.filter,
          hashtags: query.hashtags,
          itemPerPage: itemPerPage,
          page: pageInfo.prev,
        })
        .then(setResultByResponse)
        .then(() => {
          if (options) options.cbs.forEach(cb => cb())
        })
    },
    [
      itemPerPage,
      pageInfo.prev,
      query.filter,
      query.hashtags,
      searchDownloadHistoryUseCase,
      setResultByResponse,
    ]
  )

  const nextPage: DownloadHistoryHook['pageHandler']['nextPage'] = useCallback(
    options => {
      if (pageInfo.next === null) return
      searchDownloadHistoryUseCase
        .process({
          filter: query.filter,
          hashtags: query.hashtags,
          itemPerPage: itemPerPage,
          page: pageInfo.next,
        })
        .then(setResultByResponse)
        .then(() => {
          if (options) options.cbs.forEach(cb => cb())
        })
    },
    [
      itemPerPage,
      pageInfo.next,
      query.filter,
      query.hashtags,
      searchDownloadHistoryUseCase,
      setResultByResponse,
    ]
  )

  const specifyPage: DownloadHistoryHook['pageHandler']['specifyPage'] =
    useCallback(
      (page, options) => {
        searchDownloadHistoryUseCase
          .process({
            filter: query.filter,
            hashtags: query.hashtags,
            itemPerPage: itemPerPage,
            page: page,
          })
          .then(setResultByResponse)
          .then(() => {
            if (options) options.cbs.forEach(cb => cb())
          })
      },
      [
        itemPerPage,
        query.filter,
        query.hashtags,
        searchDownloadHistoryUseCase,
        setResultByResponse,
      ]
    )

  const setItemCount: DownloadHistoryHook['pageHandler']['setItemPerPage'] =
    useCallback(
      (count, options) => {
        setItemPerPage(count)
        searchDownloadHistoryUseCase
          .process({
            filter: query.filter,
            hashtags: query.hashtags,
            itemPerPage: count,
            page: pageInfo.current,
          })
          .then(setResultByResponse)
          .then(() => {
            if (options) options.cbs.forEach(cb => cb())
          })
      },
      [
        pageInfo,
        query.filter,
        query.hashtags,
        searchDownloadHistoryUseCase,
        setResultByResponse,
      ]
    )

  return {
    info: {
      isLoaded: isLoaded,
      total: total,
      totalPages: pageInfo.total,
      currentPage: pageInfo.current,
      hasNextPage: pageInfo.next !== null,
      hasPrevPage: pageInfo.prev !== null,
    },
    pageHandler: {
      specifyPage,
      nextPage,
      prevPage,
      setItemPerPage: setItemCount,
    },
    handler: {
      clear: async () => downloadHistoryRepo.clear(),
      deleteItemById: async id => downloadHistoryRepo.removeByTweetId(id),
      search: useCallback(
        query => {
          setQuery(query)
          loadLatest({ itemPerPage, query })
        },
        [itemPerPage, loadLatest]
      ),
      refresh: useCallback(
        options => {
          loadLatest({ itemPerPage, query: DEFAULT_QUERY }).then(() => {
            if (options) options.cbs.forEach(cb => cb())
          })
        },
        [itemPerPage, loadLatest]
      ),
      import: useCallback<DownloadHistoryHook['handler']['import']>(
        async data => {
          const { value: portableHistory, error } =
            validatePortableHistoryData(data)

          if (error) {
            // eslint-disable-next-line no-console
            console.error(error)
            return new PortableHistoryFormatError('Invalid format', {
              cause: error,
            })
          }

          return await portableDownloadHistoryRepo.import(
            v5PortableDownloadHistoryToDownloadHistories(portableHistory)
          )
        },
        [portableDownloadHistoryRepo]
      ),
      export: useCallback(async () => {
        const result = await portableDownloadHistoryRepo.export(async blob =>
          URL.createObjectURL(blob)
        )

        if (result.error) {
          // eslint-disable-next-line no-console
          console.error(result.error)
          return toErrorResult(result.error)
        }

        return toSuccessResult(result.value)
      }, [portableDownloadHistoryRepo]),
    },
    items: items,
  }
}

const portableHistoryItemSchema: Joi.ObjectPropertiesSchema<V5PortableDownloadHistoryItemProps> =
  Joi.object({
    tweetId: Joi.string(),
    displayName: Joi.string(),
    screenName: Joi.string(),
    userId: Joi.string(),
    mediaType: Joi.string<MediaType>().valid(
      MediaType.Mixed,
      MediaType.Video,
      MediaType.Image
    ),
    hashtags: Joi.array().items(Joi.string()).default([]),
    thumbnail: Joi.string(),
    tweetTime: Joi.date(),
    downloadTime: Joi.date(),
  })

const portableHistorySchema: Joi.ObjectSchema<V5JsonSchema> = Joi.object({
  version: Joi.string()
    .required()
    .custom((value, _helpers) => {
      if (!semver.satisfies(value, '>=4'))
        throw new Error('version must satisfies `>=4`')

      return value
    }),
  items: Joi.array().items(portableHistoryItemSchema).required(),
})

const validatePortableHistoryData = (
  data: ArrayBuffer | string
): Result<V5PortableHistory> => {
  const dataString =
    typeof data === 'string' ? data : new TextDecoder().decode(data)

  const jsonResult = parseJson(dataString)
  if (jsonResult.error) return jsonResult

  const { value: portableHistoryObject, error } =
    portableHistorySchema.validate(jsonResult.value)

  if (error) return toErrorResult(error)

  return toSuccessResult(V5PortableHistory.fromJSON(portableHistoryObject))
}

const parseJson = (data: string) => {
  try {
    const dataJson = JSON.parse(data)
    return toSuccessResult(dataJson)
  } catch (error) {
    return toErrorResult(toError(error))
  }
}

export default useDownloadHistory
