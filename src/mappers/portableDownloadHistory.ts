/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import {
  DownloadHistory,
  DownloadHistoryId,
} from '#domain/entities/downloadHistory'
import type { Factory } from '#domain/factories/base'
import { DownloadHistoryTweetUser } from '#domain/valueObjects/downloadHistoryTweetUser'
import type { V5PortableHistory } from '#domain/valueObjects/portableDownloadHistory'
import { V5PortableDownloadHistoryItem } from '#domain/valueObjects/portableDownloadHistoryItem'

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
        tweetUser: new DownloadHistoryTweetUser({
          displayName: props.displayName,
          screenName: props.screenName,
          userId: props.userId,
        }),
        thumbnail: props.thumbnail,
      })
  )
