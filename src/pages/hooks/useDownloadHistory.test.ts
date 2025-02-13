/**
 * @jest-environment jsdom
 */
import { V5PortableHistory } from '#domain/valueObjects/portableDownloadHistory'
import { MockSearchDownloadHistoryUseCase } from '#mocks/applicationUseCases/searchDownloadHistory'
import { MockPortableDownloadHistoryRepo } from '#mocks/repositories/portableDownloadHistory'
import { MockSearchDownloadHistory } from '#mocks/useCases/searchDownloadHistory'
import { MockSearchTweetIdsByHashTags } from '#mocks/useCases/searchTweetIdsByHashtags'
import { toSuccessResult } from '#utils/result'
import { generatePortableDownloadHistoryItem } from '#utils/test/v5ProtableHistoryItem'
import useDownloadHistory from './useDownloadHistory'
import { faker } from '@faker-js/faker/.'
import { act, renderHook, waitFor } from '@testing-library/react'

describe('unit test for useDownloadHistory hook', () => {
  const mockSearchDownloadHistoryUseCase = new MockSearchDownloadHistoryUseCase(
    new MockSearchDownloadHistory(),
    new MockSearchTweetIdsByHashTags()
  )
  const mockPortableDownloadHistoryRepo = new MockPortableDownloadHistoryRepo()

  afterEach(() => {
    jest.resetAllMocks()
    jest.restoreAllMocks()
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

    it('can import history', async () => {
      const mockImport = jest
        .spyOn(mockPortableDownloadHistoryRepo, 'import')
        .mockResolvedValueOnce(undefined)

      const { result } = renderHook(() =>
        useDownloadHistory({
          searchDownloadHistoryUseCase: mockSearchDownloadHistoryUseCase,
          initItemPerPage: 20,
          portableDownloadHistoryRepo: mockPortableDownloadHistoryRepo,
        })
      )

      const portableDownloadHistory = new V5PortableHistory({
        items: Array.from({ length: 10 }, generatePortableDownloadHistoryItem),
      })

      const dataString = JSON.stringify(portableDownloadHistory)
      const importError = await result.current.handler.import(dataString)
      expect(importError).toBeUndefined()
      expect(mockImport).toHaveBeenCalledOnce()
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
        })
      )

      const exportResult = await result.current.handler.export()
      expect(exportResult.value).toBe(expectedDownloadLink)
      expect(mockExport).toHaveBeenCalledOnce()
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
