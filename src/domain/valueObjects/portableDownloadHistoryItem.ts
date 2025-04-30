/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import MediaType from '#enums/mediaType'
import { ValueObject } from './base'

export type V5PortableDownloadHistoryItemProps = {
  tweetId: string
  screenName: string
  displayName: string
  tweetTime: Date
  downloadTime: Date
  mediaType: MediaType
  thumbnail: string
  userId: string
  hashtags: string[]
}

export class V5PortableDownloadHistoryItem extends ValueObject<V5PortableDownloadHistoryItemProps> {}
