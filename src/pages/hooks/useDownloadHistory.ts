import type {
  DownloadHistoryInfo,
  DownloadHistoryQueryResponse,
  Query,
} from '../../applicationUseCases/searchDownloadHistory'
import type { SearchDownloadHistoryUseCase } from '../../applicationUseCases/searchDownloadHistory'
import { useCallback, useEffect, useState } from 'react'

export type DownloadHistoryItem = DownloadHistoryInfo

interface WithCallbacks {
  cbs: Callback[]
}

type DownloadHistory = {
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
  }
  items: DownloadHistoryInfo[]
  pageHandler: {
    setItemPerPage: (count: number) => void
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

const useDownloadHistory = ({
  searchDownloadHistoryUseCase,
  initItemPerPage,
}: {
  searchDownloadHistoryUseCase: SearchDownloadHistoryUseCase
  initItemPerPage: number
}): DownloadHistory => {
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

  const setResultByResponse = useCallback((resp: DownloadHistoryQueryResponse) => {
    setItems(resp.result.items)
    setTotal(resp.$metadata.matchedCount)
    setPageInfo(resp.$metadata.page)
  }, [])

  const loadLatest = useCallback(
    async ({ itemPerPage, query }: { itemPerPage: number; query: SearchQuery }) => {
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
  }, [itemPerPage, loadLatest, query])

  const prevPage: DownloadHistory['pageHandler']['prevPage'] = useCallback(
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

  const nextPage: DownloadHistory['pageHandler']['nextPage'] = useCallback(
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

  const specifyPage: DownloadHistory['pageHandler']['specifyPage'] = useCallback(
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
      setItemPerPage,
    },
    handler: {
      search: useCallback(query => setQuery(query), []),
      refresh: useCallback(
        options => {
          loadLatest({ itemPerPage, query: DEFAULT_QUERY }).then(() => {
            if (options) options.cbs.forEach(cb => cb())
          })
        },
        [itemPerPage, loadLatest]
      ),
    },
    items: items,
  }
}

export default useDownloadHistory
