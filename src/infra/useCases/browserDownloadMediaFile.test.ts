import BrowserDownloadDispatched from '#domain/events/BrowserDownloadDispatched'
import BrowserDownloadIsFailed from '#domain/events/BrowserDownloadFailed'
import { DownloadTarget } from '#domain/valueObjects/downloadTarget'
import { TweetInfo } from '#domain/valueObjects/tweetInfo'
import { WebExtAction } from '#libs/webExtMessage'
import { BrowserDownloadMediaFile } from './browserDownloadMediaFile'
import { faker } from '@faker-js/faker/locale/en'
import { downloads, runtime, tabs } from 'webextension-polyfill'

const generateDownloadTarget = () =>
  new DownloadTarget({
    filename: faker.system.fileName(),
    url: faker.internet.url(),
  })

afterEach(() => jest.resetAllMocks())

it('can download target file and emit browser download event', async () => {
  const mockDownload = jest.spyOn(downloads, 'download').mockResolvedValue(1)
  const tweetInfo = new TweetInfo({
    screenName: 'someone',
    tweetId: '1145141919810',
  })
  const useCase = new BrowserDownloadMediaFile(tweetInfo, false)

  const targets = faker.helpers.multiple(generateDownloadTarget, {
    count: faker.number.int({ min: 1, max: 20 }),
  })

  await Promise.all(targets.map(target => useCase.process({ target })))

  expect(mockDownload).toHaveBeenCalledTimes(targets.length)
  expect(useCase.events.length).toBe(targets.length)
  expect(
    useCase.events.every(event => event instanceof BrowserDownloadDispatched)
  ).toBeTruthy()
})

it('can emit internal error event when the browser download api has error', async () => {
  const mockDownload = jest
    .spyOn(downloads, 'download')
    .mockResolvedValue(undefined as unknown as number)
  const tweetInfo = new TweetInfo({
    screenName: 'someone',
    tweetId: '1145141919810',
  })
  const useCase = new BrowserDownloadMediaFile(tweetInfo, false)

  const targets = faker.helpers.multiple(generateDownloadTarget, {
    count: faker.number.int({ min: 1, max: 20 }),
  })

  await Promise.all(targets.map(target => useCase.process({ target })))

  expect(mockDownload).toHaveBeenCalledTimes(targets.length)
  expect(useCase.events.length).toBe(targets.length)
  expect(
    useCase.events.every(event => event instanceof BrowserDownloadIsFailed)
  ).toBeTruthy()
})

describe('gif download', () => {
  const tweetInfo = new TweetInfo({
    screenName: 'someone',
    tweetId: '1145141919810',
  })
  const sourceUrl = 'https://video.twimg.com/tweet_video/GbS7YUabsAAfjEP.mp4'
  const gifDataUrl = 'data:image/gif;base64,R0lGODlh'
  const gifTarget = new DownloadTarget({
    filename: 'media-harvest/foo.gif',
    url: sourceUrl,
  })
  const okConversionResponse = {
    status: 'ok',
    payload: { dataUrl: gifDataUrl },
  }

  it('can convert the source video via the origin tab and download the converted gif', async () => {
    const mockDownload = jest.spyOn(downloads, 'download').mockResolvedValue(1)
    const mockSendTabMessage = jest
      .spyOn(tabs, 'sendMessage')
      .mockResolvedValue(okConversionResponse)

    const useCase = new BrowserDownloadMediaFile(tweetInfo, false, 42)
    await useCase.process({ target: gifTarget })

    expect(mockSendTabMessage).toHaveBeenCalledWith(
      42,
      expect.objectContaining({
        action: WebExtAction.ConvertMp4ToGif,
        payload: { url: sourceUrl },
      })
    )
    expect(mockDownload).toHaveBeenCalledWith(
      expect.objectContaining({
        url: gifDataUrl,
        filename: 'media-harvest/foo.gif',
      })
    )

    const [event] = useCase.events
    expect(event).toBeInstanceOf(BrowserDownloadDispatched)
    expect(
      (event as BrowserDownloadDispatched).downloadConfig.mapBy(
        props => props.url
      )
    ).toBe(sourceUrl)
  })

  it('can convert via an opened x tab when the origin tab is unknown', async () => {
    const mockDownload = jest.spyOn(downloads, 'download').mockResolvedValue(1)
    const mockQuery = jest
      .spyOn(tabs, 'query')
      .mockResolvedValue([
        { id: 5, active: false } as never,
        { id: 7, active: true } as never,
      ])
    const mockSendTabMessage = jest
      .spyOn(tabs, 'sendMessage')
      .mockResolvedValue(okConversionResponse)

    const useCase = new BrowserDownloadMediaFile(tweetInfo, false)
    await useCase.process({ target: gifTarget })

    expect(mockQuery).toHaveBeenCalledOnce()
    expect(mockSendTabMessage).toHaveBeenCalledWith(7, expect.anything())
    expect(mockDownload).toHaveBeenCalledWith(
      expect.objectContaining({ url: gifDataUrl })
    )
  })

  it('can fall back to the original media with a matching extension when conversion fails', async () => {
    const mockDownload = jest.spyOn(downloads, 'download').mockResolvedValue(1)
    jest
      .spyOn(tabs, 'sendMessage')
      .mockRejectedValue(new Error('Could not establish connection.'))

    const useCase = new BrowserDownloadMediaFile(tweetInfo, false, 42)
    await useCase.process({ target: gifTarget })

    expect(mockDownload).toHaveBeenCalledWith(
      expect.objectContaining({
        url: sourceUrl,
        filename: 'media-harvest/foo.mp4',
      })
    )

    const [event] = useCase.events
    expect(event).toBeInstanceOf(BrowserDownloadDispatched)
    expect(
      (event as BrowserDownloadDispatched).downloadConfig.mapBy(
        props => props.filename
      )
    ).toBe('media-harvest/foo.mp4')
  })

  it('can fall back to the original media when no x tab can convert', async () => {
    const mockDownload = jest.spyOn(downloads, 'download').mockResolvedValue(1)
    jest.spyOn(tabs, 'query').mockResolvedValue([])
    const mockSendTabMessage = jest.spyOn(tabs, 'sendMessage')

    const useCase = new BrowserDownloadMediaFile(tweetInfo, false)
    await useCase.process({ target: gifTarget })

    expect(mockSendTabMessage).not.toHaveBeenCalled()
    expect(mockDownload).toHaveBeenCalledWith(
      expect.objectContaining({
        url: sourceUrl,
        filename: 'media-harvest/foo.mp4',
      })
    )
  })

  it('keeps the service worker alive while conversion is in progress', async () => {
    jest.useFakeTimers()
    const runtimeApis = runtime as unknown as Record<string, unknown>
    const originalGetPlatformInfo = runtimeApis.getPlatformInfo
    try {
      const mockGetPlatformInfo = jest.fn().mockResolvedValue({})
      runtimeApis.getPlatformInfo = mockGetPlatformInfo
      jest.spyOn(downloads, 'download').mockResolvedValue(1)
      let finishConversion: (value: unknown) => void = () => undefined
      jest.spyOn(tabs, 'sendMessage').mockReturnValue(
        new Promise(resolve => {
          finishConversion = resolve
        })
      )

      const useCase = new BrowserDownloadMediaFile(tweetInfo, false, 42)
      const processing = useCase.process({ target: gifTarget })

      await jest.advanceTimersByTimeAsync(60_000)
      expect(mockGetPlatformInfo).toHaveBeenCalled()

      finishConversion(okConversionResponse)
      await processing
    } finally {
      runtimeApis.getPlatformInfo = originalGetPlatformInfo
      jest.useRealTimers()
    }
  })

  it('should not attempt conversion for gif thumbnails', async () => {
    const mockDownload = jest.spyOn(downloads, 'download').mockResolvedValue(1)
    const mockQuery = jest.spyOn(tabs, 'query')
    const mockSendTabMessage = jest.spyOn(tabs, 'sendMessage')
    const thumbnailUrl = 'https://pbs.twimg.com/tweet_video_thumb/abc.jpg'

    const useCase = new BrowserDownloadMediaFile(tweetInfo, false, 42)
    await useCase.process({
      target: new DownloadTarget({
        filename: 'media-harvest/thumb.jpg',
        url: thumbnailUrl,
      }),
    })

    expect(mockQuery).not.toHaveBeenCalled()
    expect(mockSendTabMessage).not.toHaveBeenCalled()
    expect(mockDownload).toHaveBeenCalledWith(
      expect.objectContaining({
        url: thumbnailUrl,
        filename: 'media-harvest/thumb.jpg',
      })
    )
  })
})
