import { downloadHistoryRepo } from '@backend/configurations'
import type { DownloadHistoryEntity } from '@backend/downloads/models'
import type { DownloadItemPredicate } from '@backend/downloads/repositories'
import DownloadHistoryUseCase from '@backend/downloads/useCases/downloadHistoryUseCase'
import { useCallback, useEffect, useState } from 'react'

export type SearchPredicate = DownloadItemPredicate

type Callbacks = Array<() => void>

type DownloadHistory = {
  info: {
    isLoaded: boolean
    total: number
    totalPages: number
    currentPage: number
  }
  handler: {
    search: (...predicates: SearchPredicate[]) => void
    export: () => Promise<void>
    import: (content: string) => Promise<void>
    refresh: (...cbs: Callbacks) => void
  }
  entities: DownloadHistoryEntity[]
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

const downloadHistoryUseCase = new DownloadHistoryUseCase(downloadHistoryRepo)

const useDownloadHistory = (itemCount: number): DownloadHistory => {
  const [historyEntities, setItems] = useState<DownloadHistoryEntity[]>([])
  const [predicates, setPredicates] = useState<SearchPredicate[]>([])
  const [pageCount, setPageCount] = useState(1)
  const [currentPage, setCurrentPage] = useState(1)
  const [itemPerPage, setItemPerPage] = useState(itemCount)
  const [isLoaded, setLoaded] = useState(false)
  const [total, setTotal] = useState(0)

  const loadLatest = useCallback(
    ({ count, skip }: SearchParams) => {
      const setStates = ([items, count]: [DownloadHistoryEntity[], number]) => {
        setItems(items)
        setTotal(count)
        const totalPages = calcTotalPages(itemPerPage)(count)
        setPageCount(totalPages)
      }

      return predicates.length === 0
        ? Promise.all([
            downloadHistoryRepo.getLatest(count, skip),
            downloadHistoryRepo.count(),
          ]).then(setStates)
        : downloadHistoryRepo
            .search(...predicates)(count, skip)
            .then(setStates)
    },
    [predicates, itemPerPage]
  )

  useEffect(() => {
    loadLatest({ count: itemCount, skip: 0 }).then(() => {
      setCurrentPage(1)
      setLoaded(true)
    })
  }, [predicates, itemCount, loadLatest])

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
      search: (...predicates) => setPredicates(predicates),
      refresh: (...cbs) => {
        setPredicates([])
        cbs.forEach(cb => cb())
      },
      export: async () => downloadHistoryUseCase.export(),
      import: async content => {
        const history = await downloadHistoryUseCase.parse(content)
        downloadHistoryUseCase.import(history.items)
      },
    },
    entities: historyEntities,
  }
}

export default useDownloadHistory
