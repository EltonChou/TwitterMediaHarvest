import type { DomainEventHandler } from '#domain/eventPublisher'
import Browser from 'webextension-polyfill'

const tweetUrl = (tweetId: string) => `https://x.com/i/web/status/${tweetId}`

export const openFailedTweetInNewTab: DomainEventHandler<
  TweetIdEvent | TweetInfoEvent
> = async event => {
  if (assertTweetIdEvent(event)) {
    await Browser.tabs.create({ url: tweetUrl(event.tweetId) })
    return
  }

  if (assertTweetInfoEvent(event)) {
    await Browser.tabs.create({ url: tweetUrl(event.tweetInfo.tweetId) })
  }
}

const assertTweetIdEvent = (event: IDomainEvent): event is TweetIdEvent =>
  Object.hasOwn(event, 'tweetId')

const assertTweetInfoEvent = (event: IDomainEvent): event is TweetInfoEvent =>
  Object.hasOwn(event, 'tweetInfo')
