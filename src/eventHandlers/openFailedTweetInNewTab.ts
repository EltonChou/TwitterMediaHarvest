import type { DomainEventHandler } from '#domain/eventPublisher'
import Browser from 'webextension-polyfill'

const tweetUrl = (tweetId: string) => `https://x.com/i/web/status/${tweetId}`

export const openFailedTweetInNewTab: DomainEventHandler<
  TweetInfoEvent
> = async event => {
  await Browser.tabs.create({ url: tweetUrl(event.tweetInfo.tweetId) })
}
