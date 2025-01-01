type TweetNotificationId = `tweet_${string}`
type DownloadNotificationId = `download_${number}`
type FilenameOverwrittenNotificationId = 'filename is overwirrten'

export const makeFilenameNotificationId = (): FilenameOverwrittenNotificationId =>
  'filename is overwirrten'

export const makeTweetFetchErrorNotificationId = (tweetId: string): TweetNotificationId =>
  `tweet_${tweetId}`
export const makeDownloadFailedNotificationId = (
  downloadItemId: number
): DownloadNotificationId => `download_${downloadItemId}`

const tweetIdPattern = /^tweet_(\d+)$/
const downloadIdPattern = /^download_(\d+)$/

export const isTweetFetchId = (id: string): id is TweetNotificationId =>
  Boolean(id.match(tweetIdPattern))

export const isDownloadId = (id: string): id is DownloadNotificationId =>
  Boolean(id.match(downloadIdPattern))

export const isFilenameOverWrittenId: Assert<
  string,
  FilenameOverwrittenNotificationId
> = id => id === 'filename is overwirrten'

export const extractDownloadId = (id: DownloadNotificationId): number => {
  const result = id.match(downloadIdPattern)
  if (!result) throw new Error(`${id} is not a download notification id.`)
  return Number(result[1])
}

export const extractTweetId = (id: TweetNotificationId): string => {
  const result = id.match(tweetIdPattern)
  if (!result) throw new Error(`${id} is not a tweet notification id.`)
  return result[1]
}
