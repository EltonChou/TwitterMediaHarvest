const mockDownload = jest.fn()
const mockSendMessage = jest.fn(() => new Promise(resolve => resolve('123')))

jest.mock('webextension-polyfill', () => {
  return {
    runtime: {
      id: 'id',
      sendMessage: jest.fn(() => mockSendMessage()),
      getURL: jest.fn(path => path),
    },
    downloads: {
      download: jest.fn(async () => await mockDownload()),
    },
    storage: {
      sync: {
        set: jest.fn(),
      },
      local: {
        set: jest.fn(),
      },
    },
  }
})

import MediaDownloader from '@backend/downloads/MediaDownloader'
import type { DownloadSettings, FeatureSettings, V4FilenameSettings } from '@schema'

describe('MediaDownloader Unit Test', () => {
  const filenameSettings: V4FilenameSettings = {
    directory: 'dl',
    filenamePattern: ['{account}', '{tweetId}', '{tweetId}'],
    noSubDirectory: true,
  }
  const downloadSettings: DownloadSettings = { aggressiveMode: false, askWhereToSave: false, enableAria2: false }
  const featureSettings: FeatureSettings = {
    autoRevealNsfw: false,
    includeVideoThumbnail: false,
    keyboardShortcut: false,
  }
  const tweetDetail: TweetDetail = {
    id: '123',
    userId: '123',
    displayName: 'displayName',
    screenName: 'screenName',
    createdAt: new Date(),
  }

  const mediaCatalog: TweetMediaCatalog = {
    images: [
      'https://pbs.twimg.com/ext_tw_video_thumb/123/pu/img/THUMBNAIL.jpg',
      'https://pbs.twimg.com/media/IMAGE.jpg',
      'https://pbs.twimg.com/media/IMAGE.jpg',
    ],
    videos: ['https://video.twimg.com/ext_tw_video/123/pu/vid/1280x720/video.mp4'],
  }
  // Browser.runtime.sendMessage(ARIA2_ID, config)
  // Browser.downloads.download(config).then(downloadId => recorder(config)(downloadId))
  beforeEach(() => {
    mockDownload.mockReset()
    mockSendMessage.mockReset()
  })

  it('can download medias from media catalog by browser download', async () => {
    const downloader = new MediaDownloader(filenameSettings, downloadSettings, featureSettings)
    await downloader.downloadMediasByMediaCatalog(tweetDetail, mediaCatalog)
    expect(mockDownload).toBeCalled()
  })

  it('can download medias from media catalog by passing to aria2 extension', async () => {
    const downloader = new MediaDownloader(
      filenameSettings,
      { ...downloadSettings, enableAria2: true },
      featureSettings
    )
    await downloader.downloadMediasByMediaCatalog(tweetDetail, mediaCatalog)
    expect(mockSendMessage).toBeCalled()
  })

  it('can download medias from media catalog includes thumbnail', async () => {
    const downloader = new MediaDownloader(filenameSettings, downloadSettings, {
      ...featureSettings,
      includeVideoThumbnail: true,
    })
    await downloader.downloadMediasByMediaCatalog(tweetDetail, mediaCatalog)
    expect(mockDownload).toBeCalledTimes(4)
  })

  it('can download medias from media catalog excludes thumbnail', async () => {
    const downloader = new MediaDownloader(filenameSettings, downloadSettings, {
      ...featureSettings,
      includeVideoThumbnail: false,
    })
    await downloader.downloadMediasByMediaCatalog(tweetDetail, mediaCatalog)
    expect(mockDownload).toBeCalledTimes(3)
  })
})
