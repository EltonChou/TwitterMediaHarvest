import {
  extractDownloadId,
  extractTweetId,
  isDownloadId,
  isTweetFetchId,
  makeDownloadFailedNotificationId,
  makeTweetFetchErrorNotificationId,
} from './notificationId'

describe('unit test for notification id helper', () => {
  it('can make tweet fetch error notification id', () => {
    expect(makeTweetFetchErrorNotificationId('123')).toBe('tweet_123')
  })

  it('can download failed notification id', () => {
    expect(makeDownloadFailedNotificationId(1)).toBe('download_1')
  })

  it('validate download id', () => {
    const downloadId = 'download_123'
    expect(isDownloadId(downloadId)).toBeTruthy()
    expect(isDownloadId('some_123')).toBeFalsy()
  })

  it('validate tweet id', () => {
    const tweetId = 'tweet_1145141919810'
    expect(isTweetFetchId(tweetId)).toBeTruthy()
    expect(isTweetFetchId('some_123')).toBeFalsy()
  })

  it('can extract download id', () => {
    const downloadId = 'download_123'
    expect(extractDownloadId(downloadId)).toBe(123)
  })

  it('extract tweet id', () => {
    const tweetId = 'tweet_1145141919810'
    expect(extractTweetId(tweetId)).toBe('1145141919810')
  })
})
