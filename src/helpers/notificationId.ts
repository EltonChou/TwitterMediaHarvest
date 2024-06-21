export const makeTweetFetchErrorNotificationId = (tweetId: string) => `tweet_${tweetId}`
export const makeDownloadFailedNotificationId = (downloadItemId: number) =>
  `download_${downloadItemId}`
