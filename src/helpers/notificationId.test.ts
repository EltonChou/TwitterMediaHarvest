import {
  makeDownloadFailedNotificationId,
  makeTweetFetchErrorNotificationId,
} from './notificationId'

test('tweet fetch error notification id maker', () => {
  expect(makeTweetFetchErrorNotificationId('123')).toBe('tweet_123')
})

test('download failed notification id maker', () => {
  expect(makeDownloadFailedNotificationId(1)).toBe('download_1')
})
