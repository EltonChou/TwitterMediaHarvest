import { DownloadHistory, DownloadHistoryId } from '#domain/entities/downloadHistory'
import type { Tweet } from '#domain/valueObjects/tweet'
import type { Factory } from './base'

export const tweetToDownloadHistory: Factory<Tweet, DownloadHistory> = tweet => {
  const thumbnail = tweet.images
    .find(media => media.mapBy(props => props.index) === 0)
    ?.getVariantUrl('thumb')

  const { id, hashtags, createdAt } = tweet.mapBy(props => ({
    id: props.id,
    hashtags: props.hashtags,
    createdAt: props.createdAt,
  }))

  const downloadHistoryId = new DownloadHistoryId(id)
  return new DownloadHistory(downloadHistoryId, {
    mediaType: tweet.mediaType,
    downloadTime: new Date(),
    hashtags: hashtags,
    tweetTime: createdAt,
    thumbnail: thumbnail,
    tweetUser: tweet.user,
  })
}
