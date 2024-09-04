import { searchDownloadHistory, searchTweetIdsByHashtags } from '../../infraProvider'
import {
  type DownloadHistoryInfo,
  Query,
  SearchDownloadHistoryUseCase,
} from 'applicationUseCases/searchDownloadHistory'
import { useCallback, useEffect, useState } from 'react'

export { type DownloadHistoryInfo } from 'applicationUseCases/searchDownloadHistory'

type Callbacks = Array<() => void>

type DownloadHistory = {
  info: {
    isLoaded: boolean
    total: number
    totalPages: number
    currentPage: number
  }
  handler: {
    search: (query: SearchQuery) => void
    // export: () => Promise<void>
    // import: (content: string) => Promise<void>
    refresh: (...cbs: Callbacks) => void
  }
  items: DownloadHistoryInfo[]
  pageHandler: {
    setItemPerPage: (count: number) => void
    nextPage: (...cbs: Callbacks) => void
    prevPage: (...cbs: Callbacks) => void
    setPage: (...cbs: Callbacks) => void
  }
}

type SearchParams = {
  count: number
  skip: number
}

const calcSkip = (itemPerPage: number) => (page: number) => (page - 1) * itemPerPage
const calcTotalPages = (itemPerPage: number) => (itemCount: number) =>
  Math.max(1, Math.ceil(itemCount / itemPerPage))

const searchDownloadHistoryUseCase = new SearchDownloadHistoryUseCase(
  searchDownloadHistory,
  searchTweetIdsByHashtags
)

export type SearchQuery = Pick<Query, 'filter' | 'hashtags'>
const defaultQuery: SearchQuery = {
  filter: { mediaType: '*', userName: '*' },
  hashtags: [],
}

const useDownloadHistory = (itemCount: number): DownloadHistory => {
  const [items, setItems] = useState<DownloadHistoryInfo[]>([])
  const [query, setQuery] = useState<SearchQuery>(defaultQuery)
  const [pageCount, setPageCount] = useState(1)
  const [currentPage, setCurrentPage] = useState(1)
  const [itemPerPage, setItemPerPage] = useState(itemCount)
  const [isLoaded, setLoaded] = useState(false)
  const [total, setTotal] = useState(0)

  const loadLatest = useCallback(
    async ({ count, skip }: SearchParams) => {
      const setStates = ([items, count]: [DownloadHistoryInfo[], number]) => {
        setItems(items)
        setTotal(count)
        const totalPages = calcTotalPages(itemPerPage)(count)
        setPageCount(totalPages)
      }

      const result = await searchDownloadHistoryUseCase.process({
        ...query,
        itemPerPage: count,
        page: currentPage,
      })

      return result.error
        ? setStates([[], 0])
        : setStates([result.items, result.matchedCount])
    },
    [currentPage, query, itemPerPage]
  )

  useEffect(() => {
    loadLatest({ count: itemCount, skip: 0 }).then(() => {
      setCurrentPage(1)
      setLoaded(true)
    })
  }, [query, itemCount, loadLatest])

  const prevPage: DownloadHistory['pageHandler']['prevPage'] = (...cbs) => {
    if (currentPage === 1) return
    const page = currentPage - 1
    setCurrentPage(page)
    loadLatest({ count: itemPerPage, skip: calcSkip(itemPerPage)(page) })
    cbs.forEach(cb => cb())
  }

  const nextPage: DownloadHistory['pageHandler']['nextPage'] = (...cbs) => {
    if (currentPage === pageCount) return
    const page = currentPage + 1
    setCurrentPage(page)
    loadLatest({ count: itemPerPage, skip: calcSkip(itemPerPage)(page) })
    cbs.forEach(cb => cb())
  }

  const setPage: DownloadHistory['pageHandler']['setPage'] =
    (...cbs) =>
    (page: number) => {
      if (currentPage === page) return
      setCurrentPage(page)
      loadLatest({ count: itemPerPage, skip: calcSkip(itemPerPage)(page) })
      cbs.forEach(cb => cb())
    }

  return {
    info: {
      isLoaded: isLoaded,
      total: total,
      totalPages: pageCount,
      currentPage: currentPage,
    },
    pageHandler: {
      setPage,
      nextPage,
      prevPage,
      setItemPerPage,
    },
    handler: {
      search: query => setQuery(query),
      refresh: (...cbs) => {
        setQuery(defaultQuery)
        cbs.forEach(cb => cb())
      },
      // export: async () => searchDownloadHistory.export(),
      // import: async content => {
      //   const history = await searchDownloadHistory.parse(content)
      //   searchDownloadHistory.import(history.items)
      // },
    },
    items: items,
  }
}

export default useDownloadHistory
