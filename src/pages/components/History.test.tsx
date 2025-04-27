/**
 * @jest-environment jsdom
 */
import { CheckDownloadWasTriggeredBySelf } from '#domain/useCases/checkDownloadWasTriggeredBySelf'
import { MockDownloadRepo } from '#mocks/repositories/download'
import { MockDownloadHistoryRepository } from '#mocks/repositories/downloadHistory'
import { MockPortableDownloadHistoryRepo } from '#mocks/repositories/portableDownloadHistory'
import { MockDownloadFile } from '#mocks/useCases/downloadFile'
import { MockSearchDownloadHistory } from '#mocks/useCases/searchDownloadHistory'
import { MockSearchTweetIdsByHashTags } from '#mocks/useCases/searchTweetIdsByHashtags'
import { generateDownloadHistory } from '#utils/test/downloadHistory'
import HistoryTable, {
  ActionBar,
  ItemActions,
  MediaTypeSelectToken,
  PageNavigator,
  PortableHistoryActionBar,
  SearchForm,
  SearchFormComponent,
  lazyHandler,
} from './History'
import { faker } from '@faker-js/faker'
import {
  act,
  fireEvent,
  getByTestId,
  render,
  screen,
  waitFor,
} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import 'core-js/stable/structured-clone'
import React from 'react'
import { downloads, runtime } from 'webextension-polyfill'

describe('unit test for HistoryTable components', () => {
  afterEach(() => {
    jest.resetAllMocks()
    jest.resetAllMocks()
  })

  test('lazyHandler', () => {
    jest.useFakeTimers({ advanceTimers: true })

    const lazyFunc = jest.fn()

    lazyHandler(1000)(lazyFunc)()

    jest.advanceTimersByTime(500)
    expect(lazyFunc).not.toHaveBeenCalled()

    jest.advanceTimersByTime(1000)
    expect(lazyFunc).toHaveBeenCalledTimes(1)

    jest.useRealTimers()
  })

  describe('unit test for ItemACtions component', () => {
    it('can execute actions', async () => {
      const user = userEvent.setup()
      const { container, unmount } = render(
        <ItemActions tweetId="tweet-id" screenName="screen-name" />
      )

      await user.click(getByTestId(container, 'item-action-download'))

      expect(getByTestId(container, 'item-action-openTweet')).toHaveAttribute(
        'href',
        'https://x.com/i/web/status/tweet-id'
      )
      expect(runtime.sendMessage).toHaveBeenCalledTimes(1)

      unmount()
    })
  })

  describe('unit test for PageNavigator component', () => {
    it('can navigate page', async () => {
      const mockNextPage = jest.fn()
      const mockPrevPage = jest.fn()
      const user = userEvent.setup()

      const { container, unmount } = render(
        <PageNavigator
          nextPage={mockNextPage}
          prevPage={mockPrevPage}
          currentPage={1}
          totalPages={5}
        />
      )

      await user.click(getByTestId(container, 'table-nav-nextPage'))
      await user.click(getByTestId(container, 'table-nav-prevPage'))

      expect(mockNextPage).toHaveBeenCalledTimes(1)
      expect(mockPrevPage).toHaveBeenCalledTimes(1)

      unmount()
    })
  })

  describe('unit test for HistoryTableActionBar component', () => {
    it('can execute actions', async () => {
      const mockRefresh = jest.fn()
      const user = userEvent.setup()

      const { container, unmount } = render(<ActionBar refresh={mockRefresh} />)

      await user.click(getByTestId(container, 'table-action-refresh'))

      expect(mockRefresh).toHaveBeenCalledTimes(1)

      unmount()
    })
  })

  describe('unit test for PortableHistoryActionBar component', () => {
    it('can trigger import', async () => {
      const mockImport = jest.fn()
      const mockExport = jest.fn()
      const user = userEvent.setup()

      const { container, unmount } = render(
        <PortableHistoryActionBar export={mockExport} import={mockImport} />
      )

      await user.click(getByTestId(container, 'history-action-import'))

      expect(mockImport).toHaveBeenCalledOnce()

      unmount()
    })

    it('can trigger export', async () => {
      const mockImport = jest.fn()
      const mockExport = jest.fn()
      const user = userEvent.setup()

      const { container, unmount } = render(
        <PortableHistoryActionBar export={mockExport} import={mockImport} />
      )

      await user.click(getByTestId(container, 'history-action-export'))

      expect(mockExport).toHaveBeenCalledOnce()

      unmount()
    })
  })

  describe('unit test for SearchForm component', () => {
    it("can react to user' behaviors", async () => {
      const mockUpdateResult = jest.fn()
      const user = userEvent.setup()
      const formRef = React.createRef<SearchFormComponent>()
      const { container, unmount } = render(
        <SearchForm update={mockUpdateResult} ref={formRef} />
      )

      waitFor(() => fireEvent.submit(screen.getByTestId('search-form')))

      expect(mockUpdateResult).not.toHaveBeenCalled()

      await user.type(getByTestId(container, 'username-input'), 'kappa')

      waitFor(() => {
        expect(mockUpdateResult).toHaveBeenCalledTimes(1)
      })

      await user.selectOptions(
        getByTestId(container, 'mediaType-select'),
        MediaTypeSelectToken.IMAGE
      )

      waitFor(() => {
        expect(mockUpdateResult).toHaveBeenCalledTimes(2)
      })

      expect(formRef.current?.value.mediaType).not.toBeUndefined()
      expect(formRef.current?.value.username).not.toBeUndefined()

      act(() => formRef.current?.reset())

      waitFor(() => {
        expect(mockUpdateResult).toHaveBeenCalledTimes(3)
      })

      act(() => fireEvent.submit(screen.getByTestId('search-form')))

      waitFor(() => {
        expect(mockUpdateResult).toHaveBeenCalledTimes(3)
      })

      unmount()
    })
  })

  test('user behavior', async () => {
    const mockDownloadFile = new MockDownloadFile()
    const mockDownloadHistoryRepo = new MockDownloadHistoryRepository()
    const mockSearchDownloadHistory = new MockSearchDownloadHistory()
    const mockSearchTweetIdsByHashTags = new MockSearchTweetIdsByHashTags()
    const mockPortableDownloadHistoryRepo =
      new MockPortableDownloadHistoryRepo()
    const mockDownloadRepo = new MockDownloadRepo()
    HTMLDivElement.prototype.scrollTo = jest.fn()

    jest.spyOn(mockSearchDownloadHistory, 'process').mockResolvedValue({
      matchedCount: 25,
      items: faker.helpers.multiple(generateDownloadHistory, { count: 25 }),
      error: undefined,
    })
    jest
      .spyOn(mockSearchTweetIdsByHashTags, 'process')
      .mockResolvedValue({ error: undefined, value: new Set(['124']) })

    downloads.onChanged = {
      addListener: jest.fn(),
      removeListener: jest.fn(),
      hasListener: jest.fn(),
    }

    act(() => {
      render(
        <HistoryTable
          searchDownloadHistory={mockSearchDownloadHistory}
          searchTweetIdsByHashtags={mockSearchTweetIdsByHashTags}
          portableDownloadHistoryRepo={mockPortableDownloadHistoryRepo}
          downloadHistoryRepo={mockDownloadHistoryRepo}
          browserDownload={mockDownloadFile}
          downloadRepo={mockDownloadRepo}
          checkDownloadIsOwnBySelf={
            new CheckDownloadWasTriggeredBySelf('EXT_ID')
          }
        />
      )
    })

    await waitFor(() => {
      expect(screen.queryAllByTestId('history-item')).toHaveLength(25)
    })
  })
})
