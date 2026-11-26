/**
 * @jest-environment jsdom
 */
import { MockSearchDownloadHistoryUseCase } from '#mocks/applicationUseCases/searchDownloadHistory'
import { MockDownloadHistoryRepository } from '#mocks/repositories/downloadHistory'
import { MockPortableDownloadHistoryRepo } from '#mocks/repositories/portableDownloadHistory'
import { MockSearchDownloadHistory } from '#mocks/useCases/searchDownloadHistory'
import { MockSearchTweetIdsByHashTags } from '#mocks/useCases/searchTweetIdsByHashtags'
import { toErrorResult, toSuccessResult } from '#utils/result'
import { generatePortableV5DownloadHistory } from '#utils/test/v5PortableDownloadHistory'
import type {
  DownloadHistoryQueryResponse,
  SearchDownloadHistoryUseCase,
} from '../../applicationUseCases/searchDownloadHistory'
import useDownloadHistory from './useDownloadHistory'
import { faker } from '@faker-js/faker'
import { act, renderHook, waitFor } from '@testing-library/react'

describe('unit test for useDownloadHistory hook', () => {
  const mockSearchDownloadHistoryUseCase = new MockSearchDownloadHistoryUseCase(
    new MockSearchDownloadHistory(),
    new MockSearchTweetIdsByHashTags()
  )
  const mockPortableDownloadHistoryRepo = new MockPortableDownloadHistoryRepo()
  const mockDownloadHistoryRepo = new MockDownloadHistoryRepository()

  afterEach(() => {
    jest.resetAllMocks()
    jest.restoreAllMocks()
  })

  const makeResponse = (
    matchedCount: number,
    current = 1
  ): DownloadHistoryQueryResponse => ({
    $metadata: {
      itemPerPage: 20,
      matchedCount,
      page: { current, next: null, prev: null, total: 10 },
    },
    result: { items: [], error: undefined },
  })

  const deferred = () => {
    let resolve!: (resp: DownloadHistoryQueryResponse) => void
    const promise = new Promise<DownloadHistoryQueryResponse>(r => {
      resolve = r
    })
    return { promise, resolve }
  }

  const renderWithUseCase = (useCase: SearchDownloadHistoryUseCase) =>
    renderHook(
      ({ searchDownloadHistoryUseCase }) =>
        useDownloadHistory({
          searchDownloadHistoryUseCase,
          initItemPerPage: 20,
          portableDownloadHistoryRepo: mockPortableDownloadHistoryRepo,
          downloadHistoryRepo: mockDownloadHistoryRepo,
        }),
      { initialProps: { searchDownloadHistoryUseCase: useCase } }
    )

  describe('unit test for request ordering', () => {
    it('should apply only the latest page when responses arrive out of order', async () => {
      const mockSearch = jest
        .spyOn(mockSearchDownloadHistoryUseCase, 'process')
        .mockResolvedValue(makeResponse(5))
      const { result } = renderWithUseCase(mockSearchDownloadHistoryUseCase)
      await waitFor(() => expect(result.current.info.isLoaded).toBeTrue())

      const slow = deferred()
      mockSearch
        .mockReturnValueOnce(slow.promise)
        .mockResolvedValueOnce(makeResponse(5, 3))
      const slowCallback = jest.fn()
      const fastCallback = jest.fn()

      act(() =>
        result.current.pageHandler.specifyPage(2, { cbs: [slowCallback] })
      )
      act(() =>
        result.current.pageHandler.specifyPage(3, { cbs: [fastCallback] })
      )
      await waitFor(() => expect(result.current.info.currentPage).toBe(3))

      await act(async () => slow.resolve(makeResponse(5, 2)))

      expect(result.current.info.currentPage).toBe(3)
      expect(fastCallback).toHaveBeenCalled()
      expect(slowCallback).not.toHaveBeenCalled()
    })

    it('should drop the initial load when a search finishes first', async () => {
      const initial = deferred()
      jest
        .spyOn(mockSearchDownloadHistoryUseCase, 'process')
        .mockReturnValueOnce(initial.promise)
        .mockResolvedValueOnce(makeResponse(7))
      const { result } = renderWithUseCase(mockSearchDownloadHistoryUseCase)

      act(() =>
        result.current.handler.search({
          filter: { userName: 'kappa', mediaType: '*' },
          hashtags: [],
        })
      )
      await waitFor(() => expect(result.current.info.total).toBe(7))
      expect(result.current.info.isLoaded).toBeTrue()

      await act(async () => initial.resolve(makeResponse(1)))

      expect(result.current.info.total).toBe(7)
    })

    it('should reset the query on refresh for later page requests', async () => {
      const mockSearch = jest
        .spyOn(mockSearchDownloadHistoryUseCase, 'process')
        .mockResolvedValue(makeResponse(5))
      const { result } = renderWithUseCase(mockSearchDownloadHistoryUseCase)
      await waitFor(() => expect(result.current.info.isLoaded).toBeTrue())

      act(() =>
        result.current.handler.search({
          filter: { userName: 'kappa', mediaType: '*' },
          hashtags: [],
        })
      )
      act(() => result.current.handler.refresh())
      act(() => result.current.pageHandler.specifyPage(2))

      await waitFor(() =>
        expect(mockSearch).toHaveBeenLastCalledWith(
          expect.objectContaining({
            page: 2,
            filter: { userName: '*', mediaType: '*' },
          })
        )
      )
    })
  })

  describe('unit test for initial load', () => {
    it('should load the first page on mount', async () => {
      const mockSearch = jest
        .spyOn(mockSearchDownloadHistoryUseCase, 'process')
        .mockResolvedValue(makeResponse(5))

      const { result } = renderWithUseCase(mockSearchDownloadHistoryUseCase)

      await waitFor(() => expect(result.current.info.isLoaded).toBeTrue())
      expect(result.current.info.total).toBe(5)
      expect(mockSearch).toHaveBeenCalledExactlyOnceWith(
        expect.objectContaining({ page: 1, itemPerPage: 20 })
      )
    })

    it('should not reload when rerendered with the same use case', async () => {
      const mockSearch = jest
        .spyOn(mockSearchDownloadHistoryUseCase, 'process')
        .mockResolvedValue(makeResponse(5))

      const { result, rerender } = renderWithUseCase(
        mockSearchDownloadHistoryUseCase
      )
      await waitFor(() => expect(result.current.info.isLoaded).toBeTrue())

      rerender({
        searchDownloadHistoryUseCase: mockSearchDownloadHistoryUseCase,
      })

      expect(mockSearch).toHaveBeenCalledTimes(1)
    })

    it('should ignore a stale result after the use case changes', async () => {
      const staleUseCase = new MockSearchDownloadHistoryUseCase(
        new MockSearchDownloadHistory(),
        new MockSearchTweetIdsByHashTags()
      )
      let resolveStale!: (resp: DownloadHistoryQueryResponse) => void
      jest.spyOn(staleUseCase, 'process').mockReturnValue(
        new Promise(resolve => {
          resolveStale = resolve
        })
      )
      jest
        .spyOn(mockSearchDownloadHistoryUseCase, 'process')
        .mockResolvedValue(makeResponse(2))

      const { result, rerender } = renderWithUseCase(staleUseCase)
      rerender({
        searchDownloadHistoryUseCase: mockSearchDownloadHistoryUseCase,
      })

      await waitFor(() => expect(result.current.info.total).toBe(2))

      await act(async () => resolveStale(makeResponse(1)))

      expect(result.current.info.total).toBe(2)
    })
  })

  describe('unit test for handler', () => {
    it('can search by query', async () => {
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
          portableDownloadHistoryRepo: mockPortableDownloadHistoryRepo,
          downloadHistoryRepo: mockDownloadHistoryRepo,
        })
      )

      await waitFor(() => {
        expect(mockSearch).toHaveBeenCalledTimes(1)
      })

      act(() =>
        result.current.handler.search({
          filter: { userName: '*', mediaType: '*' },
          hashtags: [],
        })
      )

      await waitFor(() => {
        expect(mockSearch).toHaveBeenCalledTimes(2)
        expect(result.current.items).toStrictEqual([])
      })
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
          portableDownloadHistoryRepo: mockPortableDownloadHistoryRepo,
          downloadHistoryRepo: mockDownloadHistoryRepo,
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

    it.each([
      {
        data: JSON.stringify(generatePortableV5DownloadHistory(10)),
        isValid: true,
      },
      {
        data: JSON.stringify({
          ...generatePortableV5DownloadHistory(10).toJSON(),
          version: '3.0.0',
        }),
        isValid: false,
      },
      {
        data: JSON.stringify({
          ...generatePortableV5DownloadHistory(10).toJSON(),
          version: '4.0.0',
        }),
        isValid: true,
      },
      {
        data: JSON.stringify({ version: '5.0.0' }),
        isValid: false,
      },
      {
        data: new TextEncoder().encode(
          JSON.stringify(generatePortableV5DownloadHistory(10))
        ).buffer,
        isValid: true,
      },
      {
        data: new TextEncoder().encode(JSON.stringify({ version: '5.0.0' }))
          .buffer,
        isValid: false,
      },
      {
        data: 'fa01}',
        isValid: false,
      },
    ])('can import history', async ({ data, isValid }) => {
      const mockImport = jest
        .spyOn(mockPortableDownloadHistoryRepo, 'import')
        .mockResolvedValueOnce(undefined)
      const mockSearch = jest
        .spyOn(mockSearchDownloadHistoryUseCase, 'process')
        .mockResolvedValue({
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
          portableDownloadHistoryRepo: mockPortableDownloadHistoryRepo,
          downloadHistoryRepo: mockDownloadHistoryRepo,
        })
      )

      waitFor(() => expect(mockSearch).toHaveBeenCalledOnce())

      const importError = await result.current.handler.import(
        data as string | ArrayBuffer
      )

      if (isValid) {
        expect(importError).toBeUndefined()
        expect(mockImport).toHaveBeenCalledOnce()
      } else {
        expect(importError).toBeDefined()
        expect(mockImport).not.toHaveBeenCalled()
      }
    })

    it('can export history', async () => {
      const expectedDownloadLink = faker.internet.url()
      const mockExport = jest
        .spyOn(mockPortableDownloadHistoryRepo, 'export')
        .mockResolvedValueOnce(toSuccessResult(expectedDownloadLink))

      const { result } = renderHook(() =>
        useDownloadHistory({
          searchDownloadHistoryUseCase: mockSearchDownloadHistoryUseCase,
          initItemPerPage: 20,
          portableDownloadHistoryRepo: mockPortableDownloadHistoryRepo,
          downloadHistoryRepo: mockDownloadHistoryRepo,
        })
      )

      const exportResult = await result.current.handler.export()
      expect(exportResult.value).toBe(expectedDownloadLink)
      expect(mockExport).toHaveBeenCalledOnce()
    })

    it('can handle history export error', async () => {
      const mockExport = jest
        .spyOn(mockPortableDownloadHistoryRepo, 'export')
        .mockResolvedValueOnce(toErrorResult(new Error('mock error')))

      const { result } = renderHook(() =>
        useDownloadHistory({
          searchDownloadHistoryUseCase: mockSearchDownloadHistoryUseCase,
          initItemPerPage: 20,
          portableDownloadHistoryRepo: mockPortableDownloadHistoryRepo,
          downloadHistoryRepo: mockDownloadHistoryRepo,
        })
      )

      const exportResult = await result.current.handler.export()
      expect(mockExport).toHaveBeenCalledOnce()
      expect(exportResult.error).toBeDefined()
    })

    it('can clear history', async () => {
      const mockClear = jest
        .spyOn(mockDownloadHistoryRepo, 'clear')
        .mockImplementationOnce(jest.fn())

      const { result } = renderHook(() =>
        useDownloadHistory({
          searchDownloadHistoryUseCase: mockSearchDownloadHistoryUseCase,
          initItemPerPage: 20,
          portableDownloadHistoryRepo: mockPortableDownloadHistoryRepo,
          downloadHistoryRepo: mockDownloadHistoryRepo,
        })
      )

      await act(async () => {
        await result.current.handler.clear()
      })

      waitFor(() => {
        expect(mockClear).toHaveBeenCalledOnce()
      })
    })

    it('can delete history item by id', async () => {
      const mockRemove = jest
        .spyOn(mockDownloadHistoryRepo, 'removeByTweetId')
        .mockImplementationOnce(jest.fn())

      const { result } = renderHook(() =>
        useDownloadHistory({
          searchDownloadHistoryUseCase: mockSearchDownloadHistoryUseCase,
          initItemPerPage: 20,
          portableDownloadHistoryRepo: mockPortableDownloadHistoryRepo,
          downloadHistoryRepo: mockDownloadHistoryRepo,
        })
      )

      await act(async () => {
        await result.current.handler.deleteItemById('1')
      })

      waitFor(() => {
        expect(mockRemove).toHaveBeenCalledOnce()
      })
    })
  })

  describe('unit test for page handler', () => {
    it('can specify page', async () => {
      const mockSearch = jest
        .spyOn(mockSearchDownloadHistoryUseCase, 'process')
        .mockResolvedValue({
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
          portableDownloadHistoryRepo: mockPortableDownloadHistoryRepo,
          downloadHistoryRepo: mockDownloadHistoryRepo,
        })
      )

      await waitFor(() => {
        expect(mockSearch).toHaveBeenCalledTimes(1)
      })

      const mockCallback = jest.fn()

      act(() =>
        result.current.pageHandler.specifyPage(10, { cbs: [mockCallback] })
      )

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
          portableDownloadHistoryRepo: mockPortableDownloadHistoryRepo,
          downloadHistoryRepo: mockDownloadHistoryRepo,
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

    it('cannot navigate to previous page when there is no previous page', async () => {
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
          portableDownloadHistoryRepo: mockPortableDownloadHistoryRepo,
          downloadHistoryRepo: mockDownloadHistoryRepo,
        })
      )

      await waitFor(() => {
        expect(mockSearch).toHaveBeenCalledTimes(1)
      })

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
          portableDownloadHistoryRepo: mockPortableDownloadHistoryRepo,
          downloadHistoryRepo: mockDownloadHistoryRepo,
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

    it('cannot navigate to next page when there is no next page', async () => {
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
          portableDownloadHistoryRepo: mockPortableDownloadHistoryRepo,
          downloadHistoryRepo: mockDownloadHistoryRepo,
        })
      )

      await waitFor(() => {
        expect(mockSearch).toHaveBeenCalledTimes(1)
      })

      const mockCallback = jest.fn()
      act(() => result.current.pageHandler.nextPage({ cbs: [mockCallback] }))

      // It should only be called when the hook mounted.
      expect(mockSearch).toHaveBeenCalledTimes(1)
      expect(result.current.info.currentPage).toBe(1)
      expect(result.current.info.hasNextPage).toBeFalsy()
      expect(mockCallback).not.toHaveBeenCalled()
    })

    it('can set the item count of page', async () => {
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
          portableDownloadHistoryRepo: mockPortableDownloadHistoryRepo,
          downloadHistoryRepo: mockDownloadHistoryRepo,
        })
      )

      await waitFor(() => {
        expect(mockSearch).toHaveBeenCalledTimes(1)
        expect(result.current.info.currentPage).toBe(5)
      })

      const mockCallback = jest.fn()

      mockSearch.mockResolvedValue({
        $metadata: {
          itemPerPage: 10,
          matchedCount: 10,
          page: { current: 6, next: 7, prev: 5, total: 10 },
        },
        result: {
          items: [],
          error: undefined,
        },
      })

      act(() =>
        result.current.pageHandler.setItemPerPage(10, { cbs: [mockCallback] })
      )

      await waitFor(() => {
        expect(result.current.items).toStrictEqual([])
        expect(result.current.info.currentPage).toBe(6)
        expect(mockSearch).toHaveBeenCalledTimes(2)
        expect(mockCallback).toHaveBeenCalled()
      })
    })
  })
})
