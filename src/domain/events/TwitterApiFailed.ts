import { DomainEvent } from './base'

export default class TwitterApiFailed
  extends DomainEvent
  implements TwitterApiErrorEvent
{
  readonly tweetInfo: TweetInfo
  readonly code: number

  constructor(tweetInfo: TweetInfo, code: number) {
    super('api:twitter:failed')
    this.tweetInfo = tweetInfo
    this.code = code
  }
}
