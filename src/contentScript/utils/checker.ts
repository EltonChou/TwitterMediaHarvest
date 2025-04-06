/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { elementExists } from 'select-dom'

export const isStreamLoaded = () =>
  elementExists('[role="region"]') && elementExists('article')

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
  return host === 'x.com' || host === 'mobile.x.com'
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
  isTweetDeck() && elementExists('#react-root')

export const isBusinessRelatedTweet = (ele: HTMLElement): boolean =>
  elementExists('[data-testid="placementTracking"]', ele) ||
  Boolean(ele.closest('[data-testid="placementTracking"]'))

export const isDefined = (...parms: unknown[]): boolean =>
  parms.every(v => v !== undefined)
