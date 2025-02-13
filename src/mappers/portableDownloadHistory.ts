import {
  DownloadHistory,
  DownloadHistoryId,
} from '#domain/entities/downloadHistory'
import type { Factory } from '#domain/factories/base'
import type { V5PortableHistory } from '#domain/valueObjects/portableDownloadHistory'
import { V5PortableDownloadHistoryItem } from '#domain/valueObjects/portableDownloadHistoryItem'
import { TweetUser } from '#domain/valueObjects/tweetUser'

export const v5PortableDownloadHistoryToDownloadHistories: Factory<
  V5PortableHistory,
  DownloadHistory[]
> = portableHistory =>
  portableHistory.mapBy(props =>
    props.items.map(v5PortableDownloadHistoryItemToDownloadHistory)
  )

export const v5PortableDownloadHistoryItemToDownloadHistory: Factory<
  V5PortableDownloadHistoryItem,
  DownloadHistory
> = portableDownloadHistoryItem =>
  portableDownloadHistoryItem.mapBy(
    props =>
      new DownloadHistory(new DownloadHistoryId(props.tweetId), {
        downloadTime: props.downloadTime,
        hashtags: props.hashtags,
        mediaType: props.mediaType,
        tweetTime: props.tweetTime,
        tweetUser: new TweetUser({
          displayName: props.displayName,
          screenName: props.screenName,
          userId: props.userId,
        }),
        thumbnail: props.thumbnail,
      })
  )
