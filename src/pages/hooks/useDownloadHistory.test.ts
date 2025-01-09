/**
 * @jest-environment jsdom
 */
import { MockSearchDownloadHistory } from '#mocks/useCases/searchDownloadHistory'
import { MockSearchTweetIdsByHashTags } from '#mocks/useCases/searchTweetIdsByHashtags'
import type {
  DownloadHistoryQueryResponse,
  Query,
} from '../../applicationUseCases/searchDownloadHistory'
import { SearchDownloadHistoryUseCase } from '../../applicationUseCases/searchDownloadHistory'
import useDownloadHistory from './useDownloadHistory'
import { act, renderHook, waitFor } from '@testing-library/react'

class MockSearchDownloadHistoryUseCase extends SearchDownloadHistoryUseCase {
  constructor() {
    super(new MockSearchDownloadHistory(), new MockSearchTweetIdsByHashTags())
  }
  searchTweetIds(hashtags: string[]): AsyncResult<Set<string>> {
    throw new Error('Method not implemented.')
  }
  process(query: Query): Promise<DownloadHistoryQueryResponse> {
    throw new Error('Method not implemented.')
  }
}

describe('unit test for useDownloadHistory hook', () => {
  const mockSearchDownloadHistoryUseCase = new MockSearchDownloadHistoryUseCase()

  afterAll(() => {
    jest.resetAllMocks()
    jest.restoreAllMocks()
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('unit test for handler', () => {
    it('can search by query', () => {
      const mockSearch = jest.spyOn(mockSearchDownloadHistoryUseCase, 'process')
      mockSearch.mockResolvedValue({
        $metadata: {
          itemPerPage: 20,
          matchedCount: 10,
          page: { current: 1, next: null, prev: null, total: 10 },
        },
        result: {
          items: [],
          error: undefined,
        },
      })

      const { result } = renderHook(() =>
        useDownloadHistory({
          searchDownloadHistoryUseCase: mockSearchDownloadHistoryUseCase,
          initItemPerPage: 20,
        })
      )

      act(() =>
        result.current.handler.search({
          filter: { userName: '*', mediaType: '*' },
          hashtags: [],
        })
      )

      expect(mockSearch).toHaveBeenCalledTimes(2)
      expect(result.current.items).toStrictEqual([])
    })

    it('can refresh', async () => {
      const mockSearch = jest.spyOn(mockSearchDownloadHistoryUseCase, 'process')
      mockSearch.mockResolvedValue({
        $metadata: {
          itemPerPage: 20,
          matchedCount: 10,
          page: { current: 1, next: null, prev: null, total: 10 },
        },
        result: {
          items: [],
          error: undefined,
        },
      })

      const { result } = renderHook(() =>
        useDownloadHistory({
          searchDownloadHistoryUseCase: mockSearchDownloadHistoryUseCase,
          initItemPerPage: 20,
        })
      )

      await waitFor(() => {
        expect(mockSearch).toHaveBeenCalledTimes(1)
      })

      // The `refresh()` will set query to the default.
      // We need to make query changed first so the hook can be triggered.
      act(() => {
        result.current.handler.search({
          filter: { userName: 'kappa', mediaType: '*' },
          hashtags: [],
        })
      })

      expect(mockSearch).toHaveBeenCalledTimes(2)

      const mockCallback = jest.fn()

      act(() => {
        result.current.handler.refresh({ cbs: [mockCallback] })
      })

      await waitFor(() => {
        expect(mockSearch).toHaveBeenCalledTimes(3)
        expect(mockCallback).toHaveBeenCalled()
        expect(result.current.info.currentPage).toBe(1)
      })
    })
  })

  describe('unit test for page handler', () => {
    it('can specify page', async () => {
      const mockSearch = jest.spyOn(mockSearchDownloadHistoryUseCase, 'process')
      mockSearch.mockResolvedValue({
        $metadata: {
          itemPerPage: 20,
          matchedCount: 10,
          page: { current: 1, next: null, prev: null, total: 10 },
        },
        result: {
          items: [],
          error: undefined,
        },
      })

      const { result } = renderHook(() =>
        useDownloadHistory({
          searchDownloadHistoryUseCase: mockSearchDownloadHistoryUseCase,
          initItemPerPage: 20,
        })
      )

      const mockCallback = jest.fn()

      act(() => result.current.pageHandler.specifyPage(10, { cbs: [mockCallback] }))

      await waitFor(() => {
        expect(mockSearch).toHaveBeenCalledTimes(2)
        expect(result.current.items).toStrictEqual([])
        expect(mockCallback).toHaveBeenCalled()
      })
    })

    it('can navigate to previous page', async () => {
      const mockSearch = jest
        .spyOn(mockSearchDownloadHistoryUseCase, 'process')
        .mockResolvedValue({
          $metadata: {
            itemPerPage: 20,
            matchedCount: 10,
            page: { current: 5, next: 6, prev: 4, total: 10 },
          },
          result: {
            items: [],
            error: undefined,
          },
        })

      const { result } = renderHook(() =>
        useDownloadHistory({
          searchDownloadHistoryUseCase: mockSearchDownloadHistoryUseCase,
          initItemPerPage: 20,
        })
      )

      await waitFor(() => {
        expect(mockSearch).toHaveBeenCalledTimes(1)
        expect(result.current.info.currentPage).toBe(5)
      })

      const mockCallback = jest.fn()

      mockSearch.mockResolvedValue({
        $metadata: {
          itemPerPage: 20,
          matchedCount: 10,
          page: { current: 4, next: 5, prev: 3, total: 10 },
        },
        result: {
          items: [],
          error: undefined,
        },
      })
      act(() => result.current.pageHandler.prevPage({ cbs: [mockCallback] }))

      await waitFor(() => {
        expect(mockCallback).toHaveBeenCalled()
        expect(result.current.items).toStrictEqual([])
        expect(result.current.info.currentPage).toBe(4)
        expect(mockSearch).toHaveBeenCalledTimes(2)
      })
    })

    it('cannot navigate to previous page when there is no previous page', () => {
      const mockSearch = jest.spyOn(mockSearchDownloadHistoryUseCase, 'process')
      mockSearch.mockResolvedValue({
        $metadata: {
          itemPerPage: 20,
          matchedCount: 10,
          page: { current: 1, next: null, prev: null, total: 10 },
        },
        result: {
          items: [],
          error: undefined,
        },
      })

      const { result } = renderHook(() =>
        useDownloadHistory({
          searchDownloadHistoryUseCase: mockSearchDownloadHistoryUseCase,
          initItemPerPage: 20,
        })
      )

      const mockCallback = jest.fn()
      act(() => result.current.pageHandler.prevPage({ cbs: [mockCallback] }))

      // It should only be called when the hook mounted.
      expect(mockSearch).toHaveBeenCalledTimes(1)
      expect(result.current.info.currentPage).toBe(1)
      expect(result.current.info.hasPrevPage).toBeFalsy()
      expect(mockCallback).not.toHaveBeenCalled()
    })

    it('can navigate to next page', async () => {
      const mockSearch = jest.spyOn(mockSearchDownloadHistoryUseCase, 'process')
      mockSearch.mockResolvedValue({
        $metadata: {
          itemPerPage: 20,
          matchedCount: 10,
          page: { current: 5, next: 6, prev: 4, total: 10 },
        },
        result: {
          items: [],
          error: undefined,
        },
      })

      const { result } = renderHook(() =>
        useDownloadHistory({
          searchDownloadHistoryUseCase: mockSearchDownloadHistoryUseCase,
          initItemPerPage: 20,
        })
      )

      await waitFor(() => {
        expect(mockSearch).toHaveBeenCalledTimes(1)
        expect(result.current.info.currentPage).toBe(5)
      })

      const mockCallback = jest.fn()

      mockSearch.mockResolvedValue({
        $metadata: {
          itemPerPage: 20,
          matchedCount: 10,
          page: { current: 6, next: 7, prev: 5, total: 10 },
        },
        result: {
          items: [],
          error: undefined,
        },
      })
      act(() => result.current.pageHandler.nextPage({ cbs: [mockCallback] }))

      await waitFor(() => {
        expect(result.current.items).toStrictEqual([])
        expect(result.current.info.currentPage).toBe(6)
        expect(mockSearch).toHaveBeenCalledTimes(2)
        expect(mockCallback).toHaveBeenCalled()
      })
    })

    it('cannot navigate to next page when there is no next page', () => {
      const mockSearch = jest.spyOn(mockSearchDownloadHistoryUseCase, 'process')
      mockSearch.mockResolvedValue({
        $metadata: {
          itemPerPage: 20,
          matchedCount: 10,
          page: { current: 1, next: null, prev: null, total: 10 },
        },
        result: {
          items: [],
          error: undefined,
        },
      })

      const { result } = renderHook(() =>
        useDownloadHistory({
          searchDownloadHistoryUseCase: mockSearchDownloadHistoryUseCase,
          initItemPerPage: 20,
        })
      )

      const mockCallback = jest.fn()
      act(() => result.current.pageHandler.nextPage({ cbs: [mockCallback] }))

      // It should only be called when the hook mounted.
      expect(mockSearch).toHaveBeenCalledTimes(1)
      expect(result.current.info.currentPage).toBe(1)
      expect(result.current.info.hasNextPage).toBeFalsy()
      expect(mockCallback).not.toHaveBeenCalled()
    })
  })
})
