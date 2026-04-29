import { TweetResponseCache } from '#infra/caches/tweetResponseCache'
import { XTransactionIdCache } from '#infra/caches/xApiTransactionId'
import { MessagePortName } from '#libs/webExtMessage/port'
import { getPortRegistry } from '../serviceWorker/portRegistry'

export const tweetResponseCache = new TweetResponseCache()

export const xTransactionIdCache = new XTransactionIdCache(() => {
  const [port] = getPortRegistry().getPorts(MessagePortName.ContentScript)
  return port
})
