import MediaDownloader from '@backend/downloads/MediaDownloader'
import { DownloadRecord } from '@backend/downloads/models'
import type { IDownloadRecordsRepository } from '@backend/downloads/repositories'
import { faker } from '@faker-js/faker'
import type { DownloadSettings, FeatureSettings, V4FilenameSettings } from '@schema'

const mockDownload = jest.fn()
const mockSendMessage = jest.fn(() => new Promise(resolve => resolve('123')))

class MockRecordRepository implements IDownloadRecordsRepository {
  async getById(downloadItemId: number): Promise<DownloadRecord> {
    return new DownloadRecord(downloadItemId, {
      tweetInfo: {
        tweetId: '123',
        screenName: 'user',
      },
      downloadConfig: {
        url: 'https://www.google.com',
      },
    })
  }

  async save(downloadRecord: DownloadRecord): Promise<void> {
    return
  }

  async removeById(downloadItemId: number): Promise<void> {
    return
  }

  async getAll(): Promise<DownloadRecord[]> {
    const record = new DownloadRecord(faker.number.int(), {
      tweetInfo: {
        tweetId: '123',
        screenName: 'user',
      },
      downloadConfig: {
        url: 'https://www.google.com',
      },
    })
    return [record]
  }
}

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

describe('MediaDownloader Unit Test', () => {
  const filenameSettings: V4FilenameSettings = {
    directory: 'dl',
    filenamePattern: ['{account}', '{tweetId}', '{tweetId}'],
    noSubDirectory: true,
    groupBy: '{account}',
    fileAggregation: false,
  }
  const downloadSettings: DownloadSettings = {
    aggressiveMode: false,
    askWhereToSave: false,
    enableAria2: false,
  }
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
      {
        url: 'https://pbs.twimg.com/ext_tw_video_thumb/123/pu/img/THUMBNAIL.jpg',
        _type: 'thumbnail',
      },
      { url: 'https://pbs.twimg.com/media/IMAGE.jpg', _type: 'normal' },
      { url: 'https://pbs.twimg.com/media/IMAGE.jpg', _type: 'normal' },
    ],
    videos: ['https://video.twimg.com/ext_tw_video/123/pu/vid/1280x720/video.mp4'],
  }
  // Browser.runtime.sendMessage(ARIA2_ID, config)
  // Browser.downloads.download(config).then(downloadId => recorder(config)(downloadId))
  beforeEach(() => {
    mockDownload.mockReset()
    mockSendMessage.mockReset()
    mockDownload.mockReturnValue(1)
    mockDownload.mockResolvedValue(1)
  })

  it('can download medias from media catalog by browser download', async () => {
    const downloader = new MediaDownloader(
      filenameSettings,
      downloadSettings,
      featureSettings,
      new MockRecordRepository()
    )
    await downloader.downloadMediasByMediaCatalog(tweetDetail)(mediaCatalog)
    expect(mockDownload).toBeCalled()
  })

  it('can download medias from media catalog by passing to aria2 extension', async () => {
    const downloader = new MediaDownloader(
      filenameSettings,
      { ...downloadSettings, enableAria2: true },
      featureSettings,
      new MockRecordRepository()
    )
    await downloader.downloadMediasByMediaCatalog(tweetDetail)(mediaCatalog)
    expect(mockSendMessage).toBeCalled()
  })

  it('can download medias from media catalog includes thumbnail', async () => {
    const downloader = new MediaDownloader(
      filenameSettings,
      downloadSettings,
      {
        ...featureSettings,
        includeVideoThumbnail: true,
      },
      new MockRecordRepository()
    )
    await downloader.downloadMediasByMediaCatalog(tweetDetail)(mediaCatalog)
    expect(mockDownload).toBeCalledTimes(4)
  })

  it('can download medias from media catalog excludes thumbnail', async () => {
    const downloader = new MediaDownloader(
      filenameSettings,
      downloadSettings,
      {
        ...featureSettings,
        includeVideoThumbnail: false,
      },
      new MockRecordRepository()
    )
    await downloader.downloadMediasByMediaCatalog(tweetDetail)(mediaCatalog)
    expect(mockDownload).toBeCalledTimes(3)
  })
})
