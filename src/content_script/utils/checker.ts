import select from 'select-dom'

export const isStreamLoaded = () =>
  select.exists('[role="region"]') && select.exists('article')

const getHost = (): string => window.location.host

/**
 * Check current page is in tweetdeck or not.
 * @returns {boolean}
 */
export const isTweetDeck = (): boolean => getHost() === 'tweetdeck.twitter.com'

/**
 * Check current page is in twitter or not.
 * @returns {boolean}
 */
export const isTwitter = (): boolean => {
  const host = getHost()
  return (
    host === 'twitter.com' ||
    host === 'mobile.twitter.com' ||
    host === 'x.com' ||
    host === 'mobile.x.com'
  )
}

const ComposeTweetRegEx = /\/compose\/tweet\/?.*/
const IntentTweetRegEx = /\/intent\/tweet\/?.*/
const TweetListRegEx = /\/i\/lists\/add_member/
const RetweetsListRegEx = /\/\d+\/retweets$/
const LikesListRegEx = /\/\d+\/likes$/
const TweetStatusRegEx = /\/.*\/status\/\d+/

/**
 * Check user is composing tweet or not.
 * @returns {boolean}
 */
export const isComposingTweet = (): boolean =>
  Boolean(window.location.pathname.match(ComposeTweetRegEx)) ||
  Boolean(window.location.pathname.match(IntentTweetRegEx))

export const isFunctionablePath = (): boolean =>
  !(
    Boolean(window.location.pathname.match(TweetListRegEx)) ||
    Boolean(window.location.pathname.match(RetweetsListRegEx)) ||
    Boolean(window.location.pathname.match(LikesListRegEx)) ||
    isComposingTweet()
  )

export const isInTweetStatus = (): boolean =>
  Boolean(window.location.pathname.match(TweetStatusRegEx))

export const isBetaTweetDeck = (): boolean =>
  isTweetDeck() && select.exists('#react-root')

export const isBusinessRelatedTweet = (ele: HTMLElement): boolean =>
  select.exists('[data-testid="placementTracking"]', ele) ||
  Boolean(ele.closest('[data-testid="placementTracking"]'))

export const isDefined = (...parms: unknown[]): boolean =>
  parms.every(v => v !== undefined)
