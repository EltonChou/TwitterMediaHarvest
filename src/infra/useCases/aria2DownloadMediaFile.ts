/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import Aria2DownloadIsDispatched from '#domain/events/Aria2DownloadIsDispatched'
import type {
  DownloadMediaFileCommand,
  DownloadMediaFileUseCase,
} from '#domain/useCases/downloadMediaFile'
import type { TweetInfo } from '#domain/valueObjects/tweetInfo'
import { Aria2DownloadMessage, sendExternalMessage } from '#libs/webExtMessage'

export class Aria2DownloadMediaFile implements DownloadMediaFileUseCase {
  #isOk: boolean
  readonly events: IDomainEvent[]
  readonly targetTweet: TweetInfo

  constructor(targetTweet: TweetInfo) {
    this.targetTweet = targetTweet
    this.#isOk = true
    this.events = []
  }

  get isOk() {
    return this.#isOk
  }

  async process(command: DownloadMediaFileCommand): Promise<void> {
    const payload = command.target.mapBy(props => ({
      filename: props.filename,
      url: props.url,
    }))
    const message = new Aria2DownloadMessage({
      ...payload,
      referrer: 'https://x.com/i/web/status/' + this.targetTweet.tweetId,
    })
    await sendExternalMessage(message)
    this.events.push(new Aria2DownloadIsDispatched())
  }
}
