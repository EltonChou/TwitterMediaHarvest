import { TweetResponseCache } from '#infra/caches/tweetResponseCache'
import { XTransactionIdCache } from '#infra/caches/xApiTransactionId'
import { MessagePortName } from '#libs/webExtMessage/port'
import { getPortManager } from '../serviceWorker/portManager'

export const tweetResponseCache = new TweetResponseCache()

export const xTransactionIdCache = new XTransactionIdCache(() => {
  const [port] = getPortManager().getPorts(MessagePortName.ContentScript)
  return port
})
