import { MockDownloadHistoryRepository } from '#mocks/repositories/downloadHistory'
import { toErrorResult, toSuccessResult } from '#utils/result'
import { CheckMediaTweetHasBeenDownloaded } from './checkMediaTweetHasBeenDownloaded'

describe('unit test for checking media tweet has been downloaded or not', () => {
  const historyRepo = new MockDownloadHistoryRepository()
  const useCase = new CheckMediaTweetHasBeenDownloaded({
    downloadHistoryRepo: historyRepo,
  })

  afterEach(() => jest.restoreAllMocks())

  it('can return true if the tweet has been downloaded', async () => {
    jest
      .spyOn(historyRepo, 'hasTweetId')
      .mockResolvedValue(toSuccessResult(true))

    const hasBeenDownloaded = await useCase.process({ tweetId: '1' })
    expect(hasBeenDownloaded).toBeTruthy()
  })

  it('can return false if the tweet has not been downloaded', async () => {
    jest
      .spyOn(historyRepo, 'hasTweetId')
      .mockResolvedValue(toSuccessResult(false))

    const hasBeenDownloaded = await useCase.process({ tweetId: '1' })
    expect(hasBeenDownloaded).toBeFalsy()
  })

  it('can return false if some errors occured', async () => {
    jest
      .spyOn(historyRepo, 'hasTweetId')
      .mockResolvedValue(toErrorResult(new Error('some error')))

    const hasBeenDownloaded = await useCase.process({ tweetId: '1' })
    expect(hasBeenDownloaded).toBeFalsy()
  })
})
