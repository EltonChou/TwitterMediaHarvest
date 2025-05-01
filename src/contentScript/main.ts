/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { FeatureSettingsRepository } from '#infra/repositories/featureSettings'
import { LocalExtensionStorageProxy } from '#infra/storageProxy'
import { sendMessage } from '#libs/webExtMessage'
import {
  CaptureResponseMessage,
  ResponseType,
} from '#libs/webExtMessage/messages/captureResponse'
import {
  TweetDeckBetaKeyboardMonitor,
  TwitterKeyboardMonitor,
} from './KeyboardMonitor'
import './main.sass'
import TweetDeckBetaObserver from './observers/TweetDeckBetaObserver'
import TwitterMediaObserver from './observers/TwitterMediaObserver'
import { isBetaTweetDeck, isTwitter } from './utils/checker'

export const featureSettingsRepo = new FeatureSettingsRepository(
  new LocalExtensionStorageProxy()
)

const useObserver = (revealNsfw: boolean) => {
  if (isTwitter()) return new TwitterMediaObserver(revealNsfw)
  if (isBetaTweetDeck()) return new TweetDeckBetaObserver(revealNsfw)
  return new TwitterMediaObserver(revealNsfw)
}

const useKeboardMonitor = () => {
  if (isTwitter()) return new TwitterKeyboardMonitor()
  if (isBetaTweetDeck()) return new TweetDeckBetaKeyboardMonitor()
  return new TwitterKeyboardMonitor()
}

const monitorKeyboardByFlag = (() => {
  let hasMonitored = false
  return (flag: boolean) => {
    if (!flag || hasMonitored) return
    const kbMonitor = useKeboardMonitor()
    if (!kbMonitor) return
    hasMonitored = true
    window.addEventListener('keyup', e => kbMonitor.handleKeyUp(e))
    window.addEventListener('keydown', e => kbMonitor.handleKeyDown(e))
  }
})()

featureSettingsRepo
  .get()
  .then(feature => {
    monitorKeyboardByFlag(feature.keyboardShortcut)
    return feature
  })
  .then(feature => {
    const observer = useObserver(feature.autoRevealNsfw)
    if (!observer) return

    window.addEventListener(
      'focus',
      (() => {
        let hasFocused = false
        return () => {
          monitorKeyboardByFlag(feature.keyboardShortcut)
          observer.initialize()
          if (!hasFocused) {
            observer.observeRoot()
            hasFocused = true
          }
        }
      })()
    )

    observer.observeRoot()
    return feature
  })

type ResponseTypeCriteria = {
  type: ResponseType
  endpoint: string
}

const responseTypeCriterias: ResponseTypeCriteria[] = [
  { type: ResponseType.TweetDetail, endpoint: 'TweetDetail' },
  { type: ResponseType.TweetResultByRestId, endpoint: 'TweetResultByRestId' },
  { type: ResponseType.UserTweets, endpoint: 'UserTweets' },
  { type: ResponseType.UserMedia, endpoint: 'UserMedia' },
  { type: ResponseType.HomeTimeline, endpoint: 'HomeTimeline' },
  { type: ResponseType.UserArticlesTweets, endpoint: 'UserArticlesTweets' },
  { type: ResponseType.UserTweetsAndReplies, endpoint: 'UserTweetsAndReplies' },
  { type: ResponseType.UserHighlightsTweets, endpoint: 'UserHighlightsTweets' },
  { type: ResponseType.Bookmarks, endpoint: 'Bookmarks' },
  { type: ResponseType.Likes, endpoint: 'Likes' },
  {
    type: ResponseType.CommunitiesExploreTimeline,
    endpoint: 'CommunitiesExploreTimeline',
  },
]

const detectResponseTypeByEndpoint = (path: string): ResponseType => {
  for (const { type, endpoint } of responseTypeCriterias) {
    if (path.endsWith(endpoint)) return type
  }

  return ResponseType.Unknown
}

document.addEventListener('mh:media-response', async e => {
  await sendMessage(
    new CaptureResponseMessage({
      type: detectResponseTypeByEndpoint(e.detail.path),
      body: e.detail.body,
    })
  )
})
