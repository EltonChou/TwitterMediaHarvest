/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { DownloadHistoryTweetUser } from '#domain/valueObjects/downloadHistoryTweetUser'
import MediaType from '#enums/mediaType'
import { Entity, EntityId } from './base'

export class DownloadHistoryId extends EntityId<string> {}

type DownloadHistoryProps = {
  tweetUser: DownloadHistoryTweetUser
  mediaType: MediaType
  hashtags: string[]
  thumbnail?: string

  tweetTime: Date
  downloadTime: Date
}

export class DownloadHistory extends Entity<
  DownloadHistoryId,
  DownloadHistoryProps
> {}
