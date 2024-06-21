import { DomainEvent } from './base'

export default class TweetParsingFailed extends DomainEvent implements TweetParsingEvent {
  readonly tweetInfo: TweetInfo

  constructor(tweetInfo: TweetInfo) {
    super('parse:tweet:failed')
    this.tweetInfo = tweetInfo
  }
}
