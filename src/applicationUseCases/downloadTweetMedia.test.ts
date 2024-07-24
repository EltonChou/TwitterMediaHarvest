import { FetchTweetError, ParseTweetError } from '#domain/useCases/fetchTweet'
import { TweetInfo } from '#domain/valueObjects/tweetInfo'
import { TwitterToken } from '#domain/valueObjects/twitterToken'
import { getEventPublisher } from '#infra/eventPublisher'
import { MockDownloadHistoryRepository } from '#mocks/repositories/downloadHistory'
import { MockDownloadSettingsRepository } from '#mocks/repositories/downloadSettings'
import { MockFeatureSettingsRepository } from '#mocks/repositories/fetureSettings'
import { MockFilenameSettingRepository } from '#mocks/repositories/filenameSetting'
import { MockXTokenRepository } from '#mocks/repositories/xToken'
import { MockDownloadMediaFile } from '#mocks/useCases/downloadMediaFile'
import { MockFetchTweet } from '#mocks/useCases/fetchTweet'
import { generateDownloadSettings } from '#utils/test/downloadSettings'
import { generateFeatureSettings } from '#utils/test/fetureSettings'
import { generateFilenameSetting } from '#utils/test/filenameSetting'
import { generateTweet } from '#utils/test/tweet'
import { DownloadTweetMedia } from './downloadTweetMedia'
import type { DownloaderBuilderMap, FetchTweetMap } from './downloadTweetMedia'

describe('unit test for download tweet media use case', () => {
  const downloadHistoryRepo = new MockDownloadHistoryRepository()
  const downloadSettingsRepo = new MockDownloadSettingsRepository()
  const featureSettingsRepo = new MockFeatureSettingsRepository()
  const filenameSettingsRepo = new MockFilenameSettingRepository()
  const xTokenRepo = new MockXTokenRepository()

  const fetchTweet = new MockFetchTweet()
  const fetchTweetMap: FetchTweetMap = {
    fallback: fetchTweet,
    latest: fetchTweet,
    guest: fetchTweet,
  }

  const aria2Downloader = new MockDownloadMediaFile()
  const browserDownloader = new MockDownloadMediaFile()

  const downloadBuilder: DownloaderBuilderMap = {
    aria2: () => aria2Downloader,
    browser: () => browserDownloader,
  }

  const useCase = new DownloadTweetMedia(
    xTokenRepo,
    downloadHistoryRepo,
    filenameSettingsRepo,
    downloadSettingsRepo,
    featureSettingsRepo,
    fetchTweetMap,
    downloadBuilder,
    getEventPublisher()
  )

  afterAll(() => jest.restoreAllMocks())

  it.each([
    {
      fetchTweetError: undefined,
      saveHistoryError: true,
      noValidCsrfToken: true,
    },
    {
      fetchTweetError: undefined,
      saveHistoryError: true,
      noValidCsrfToken: true,
    },
    {
      fetchTweetError: undefined,
      saveHistoryError: false,
      noValidCsrfToken: true,
    },
    {
      fetchTweetError: new ParseTweetError('kappa'),
      saveHistoryError: true,
      noValidCsrfToken: false,
    },
    { fetchTweetError: undefined, saveHistoryError: false, noValidCsrfToken: true },
    {
      fetchTweetError: new FetchTweetError(404),
      saveHistoryError: false,
      noValidCsrfToken: false,
    },
    {
      fetchTweetError: new Error(),
      saveHistoryError: false,
      noValidCsrfToken: false,
    },
    { fetchTweetError: undefined, saveHistoryError: false, noValidCsrfToken: false },
  ])(
    'can download media files by tweet info.',
    async ({ fetchTweetError, saveHistoryError, noValidCsrfToken }) => {
      const shouldBeGood = [fetchTweetError, noValidCsrfToken].every(v => !v)

      jest
        .spyOn(xTokenRepo, 'getByName')
        .mockResolvedValue(
          noValidCsrfToken
            ? undefined
            : new TwitterToken({ name: 'gt', value: 'csrf_token' })
        )

      jest
        .spyOn(downloadHistoryRepo, 'save')
        .mockResolvedValue(saveHistoryError ? new Error() : undefined)

      jest.spyOn(fetchTweet, 'process').mockResolvedValue(
        fetchTweetError
          ? { value: undefined, remainingQuota: -1, error: fetchTweetError }
          : {
              value: generateTweet(),
              remainingQuota: 150,
              error: undefined,
            }
      )

      jest.spyOn(filenameSettingsRepo, 'get').mockResolvedValue(generateFilenameSetting())
      jest
        .spyOn(downloadSettingsRepo, 'get')
        .mockResolvedValue(generateDownloadSettings())
      jest.spyOn(featureSettingsRepo, 'get').mockResolvedValue(generateFeatureSettings())
      jest.spyOn(aria2Downloader, 'process').mockImplementation(jest.fn())
      jest.spyOn(browserDownloader, 'process').mockImplementation(jest.fn())

      const tweetInfo = new TweetInfo({
        screenName: 'scree_name',
        tweetId: '1145141919810',
      })

      const isGood = await useCase.process({ tweetInfo })
      expect(isGood).toBe(shouldBeGood)
    }
  )
})
