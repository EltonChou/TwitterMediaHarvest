/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { DownloadHistory } from '#domain/entities/downloadHistory'
import { DownloadHistoryId } from '#domain/entities/downloadHistory'
import type { Factory } from '#domain/factories/base'
import { DownloadHistoryTweetUser } from '#domain/valueObjects/downloadHistoryTweetUser'
import { V5PortableDownloadHistoryItem } from '#domain/valueObjects/portableDownloadHistoryItem'
import type { DownloadHistoryItem } from '#libs/idb/download/schema'

export const downloadHistoryToIDBItem: Factory<
  DownloadHistory,
  DownloadHistoryItem
> = downloadHistory =>
  downloadHistory.mapBy((id, props) => ({
    ...props.tweetUser.mapBy(props => props),
    hashtags: new Set(props.hashtags ?? []),
    mediaType: props.mediaType,
    tweetId: id.value,
    tweetTime: props.tweetTime,
    downloadTime: props.downloadTime,
    thumbnail: props.thumbnail,
  }))

export const dbItemToDownloadHistory: Factory<
  DownloadHistoryItem,
  DownloadHistory
> = item => {
  const id = new DownloadHistoryId(item.tweetId)
  const history = new DownloadHistory(id, {
    downloadTime: item.downloadTime,
    // Old history item might be lack of hashtags, provide an emptry set as fallback.
    hashtags: Array.from(item.hashtags ?? makeHashtagSet()),
    thumbnail: item.thumbnail,
    mediaType: item.mediaType,
    tweetTime: item.tweetTime,
    tweetUser: new DownloadHistoryTweetUser({
      displayName: item.displayName,
      screenName: item.screenName,
      userId: item.userId,
    }),
  })
  return history
}

export const downloadHistoryDBItemToProtableHistoryItem: Factory<
  DownloadHistoryItem,
  V5PortableDownloadHistoryItem
> = item =>
  new V5PortableDownloadHistoryItem({
    displayName: item.displayName,
    downloadTime: item.downloadTime,
    // Old history item might be lack of hashtags, provide an emptry set as fallback.
    hashtags: Array.from(item.hashtags ?? makeHashtagSet()),
    mediaType: item.mediaType,
    screenName: item.screenName,
    thumbnail: item.thumbnail ?? '',
    tweetId: item.tweetId,
    userId: item.userId,
    tweetTime: item.tweetTime,
  })

const makeHashtagSet = () => new Set<string>()
