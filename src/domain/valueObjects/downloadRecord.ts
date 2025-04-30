/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { ValueObject } from './base'
import type { DownloadConfig } from './downloadConfig'
import type { TweetInfo } from './tweetInfo'

type DownloadRecordProps = {
  downloadId: number
  tweetInfo: TweetInfo
  downloadConfig: DownloadConfig
  recordedAt: Date
}

export class DownloadRecord extends ValueObject<DownloadRecordProps> {}
