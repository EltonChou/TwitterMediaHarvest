import type { DownloadHistory } from '#domain/entities/downloadHistory'
import type { Factory } from '#domain/factories/base'
import type { DownloadHistoryItem } from '#libs/idb/download/schema'

export const downloadHistoryToIDBItem: Factory<
  DownloadHistory,
  DownloadHistoryItem
> = downloadHistory =>
  downloadHistory.mapBy((id, props) => ({
    ...props.tweetUser.mapBy(props => props),
    hashtags: new Set(props.hashtags),
    mediaType: props.mediaType,
    tweetId: id.value,
    tweetTime: props.tweetTime,
    downloadTime: props.downloadTime,
    thumbnail: props.thumbnail,
  }))
