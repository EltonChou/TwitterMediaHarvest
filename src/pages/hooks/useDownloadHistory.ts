import { downloadHistoryRepo } from '@backend/configurations'
import type { DownloadHistoryEntity } from '@backend/downloads/models'
import type { DownloadItemPredicate } from '@backend/downloads/repositories'
import { useEffect, useState } from 'react'

export type SearchPredicate = DownloadItemPredicate

type DownloadHistory = {
  info: {
    isLoaded: boolean
    total: number
    totalPages: number
    currentPage: number
  }
  handler: {
    refresh: (...cbs: Array<() => void>) => void
    nextPage: (...cbs: Array<() => void>) => void
    prevPage: (...cbs: Array<() => void>) => void
    setItemPerPage: (count: number) => void
    search: (...predicates: SearchPredicate[]) => void
  }
  entities: DownloadHistoryEntity[]
}

const calcSkip = (itemPerPage: number) => (page: number) => (page - 1) * itemPerPage
const calcTotalPages = (itemPerPage: number) => (itemCount: number) =>
  Math.floor(itemCount / itemPerPage) + 1

const useDownloadHistory = (itemCount: number): DownloadHistory => {
  const [historyEntities, setItems] = useState<DownloadHistoryEntity[]>([])
  const [predicates, setPredicates] = useState<SearchPredicate[]>([])
  const [pageCount, setPageCount] = useState(1)
  const [currentPage, setCurrentPage] = useState(1)
  const [itemPerPage, setItemPerPage] = useState(itemCount)
  const [isLoaded, setLoaded] = useState(false)
  const [total, setTotal] = useState(0)

  const loadLatest = (count: number) => (skip: number) => {
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
  }

  const refresh = (...cbs: Array<() => void>) => {
    setPredicates([])
    cbs.forEach(cb => cb())
  }

  useEffect(() => {
    loadLatest(itemCount)(0).then(() => {
      setCurrentPage(1)
      setLoaded(true)
    })
  }, [predicates])

  const prevPage = (...cbs: Array<() => void>) => {
    if (currentPage === 1) return
    const page = currentPage - 1
    setCurrentPage(page)
    loadLatest(itemPerPage)(calcSkip(itemPerPage)(page))
    cbs.forEach(cb => cb())
  }

  const nextPage = (...cbs: Array<() => void>) => {
    if (currentPage === pageCount) return
    const page = currentPage + 1
    setCurrentPage(page)
    loadLatest(itemPerPage)(calcSkip(itemPerPage)(page))
    cbs.forEach(cb => cb())
  }

  const search = (...predicates: SearchPredicate[]) => setPredicates(predicates)

  return {
    info: {
      isLoaded: isLoaded,
      total: total,
      totalPages: pageCount,
      currentPage: currentPage,
    },
    handler: {
      refresh,
      nextPage,
      prevPage,
      setItemPerPage,
      search,
    },
    entities: historyEntities,
  }
}

export default useDownloadHistory
