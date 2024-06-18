import { DomainEvent } from './base'

export default class TweetApiFailed extends DomainEvent {
  name = 'api:twitter:failed'

  readonly tweetInfo: TweetInfo
  readonly code: number

  constructor(tweetInfo: TweetInfo, code: number) {
    super()
    this.tweetInfo = tweetInfo
    this.code = code
  }
}
