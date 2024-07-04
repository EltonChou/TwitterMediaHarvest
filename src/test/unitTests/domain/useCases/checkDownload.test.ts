import FilenameOverwritten from '#domain/events/FilenameOverwritten'
import { CheckDownload } from '#domain/useCases/checkDownload'
import { DownloadConfig } from '#domain/valueObjects/downloadConfig'
import { DownloadRecord } from '#domain/valueObjects/downloadRecord'
import { TweetInfo } from '#domain/valueObjects/tweetInfo'
import { generateDownloadItem } from '#utils/tests/downloadItem'

describe('unit test for download checking use case', () => {
  it('can emit FilenameOverWritten event when the final filename is modified.', async () => {
    const item = generateDownloadItem({
      filename: '/usr/local/downloads/114514.jpg_orig',
    })

    const downloadRecord = new DownloadRecord({
      downloadConfig: new DownloadConfig({
        conflictAction: 'overwrite',
        filename: '/usr/local/downloads/expect.jpg',
        saveAs: true,
        url: 'url',
      }),
      downloadId: 1,
      recordedAt: new Date(),
      tweetInfo: new TweetInfo({ screenName: 'name', tweetId: 'tweetId' }),
    })

    const useCase = new CheckDownload()
    const events = useCase.process({ item: item, record: downloadRecord })
    expect(events.some(e => e instanceof FilenameOverwritten)).toBeTruthy()
  })

  it('will not emit FilenameOverWritten event when the final filename is correct.', async () => {
    const item = generateDownloadItem({ filename: '/usr/local/downloads/same.jpg' })

    const downloadRecord = new DownloadRecord({
      downloadConfig: new DownloadConfig({
        conflictAction: 'overwrite',
        filename: '/usr/local/downloads/same.jpg',
        saveAs: true,
        url: 'url',
      }),
      downloadId: 1,
      recordedAt: new Date(),
      tweetInfo: new TweetInfo({ screenName: 'name', tweetId: 'tweetId' }),
    })

    const useCase = new CheckDownload()
    const events = useCase.process({ item: item, record: downloadRecord })
    expect(events.some(e => e instanceof FilenameOverwritten)).toBeFalsy()
  })
})
