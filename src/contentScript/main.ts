/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import type { Factory } from '#domain/factories/base'
import { FeatureSettingsRepository } from '#infra/repositories/featureSettings'
import { LocalExtensionStorageProxy } from '#infra/storageProxy'
import { sendMessage } from '#libs/webExtMessage'
import {
  CaptureResponseMessage,
  ResponseType,
} from '#libs/webExtMessage/messages/captureResponse'
import { RequestTransactionIdMessage } from '#libs/webExtMessage/messages/requestTransactionId'
import type { FeatureSettings } from '#schema'
import { isErrorResult } from '#utils/result'
import {
  TweetDeckBetaKeyboardMonitor,
  TwitterKeyboardMonitor,
} from './KeyboardMonitor'
import './main.sass'
import TweetDeckBetaObserver from './observers/TweetDeckBetaObserver'
import TwitterMediaObserver from './observers/TwitterMediaObserver'
import XMediaObserver from './observers/XMediaObserver'
import type { IHarvestObserver, ObserverOptions } from './observers/types'
import { isBetaTweetDeck, isTwitter, isX } from './utils/checker'
import { runtime } from 'webextension-polyfill'

/**
 * Firefox-specific function to clone objects between privileged and unprivileged contexts
 *
 * @platform Firefox
 * @browser Firefox
 * @see {@link https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/Sharing_objects_with_page_scripts#cloneinto | Firefox docs}
 */
declare function cloneInto<T>(
  object: T,
  targetScope: object,
  options?: { cloneFunctions?: boolean; wrapReflectors?: boolean }
): T

export const featureSettingsRepo = new FeatureSettingsRepository(
  new LocalExtensionStorageProxy()
)

const useObserver = (observerOptions: ObserverOptions): IHarvestObserver => {
  if (isX()) return new XMediaObserver(observerOptions)
  if (isTwitter()) return new TwitterMediaObserver(observerOptions)
  if (isBetaTweetDeck()) return new TweetDeckBetaObserver(observerOptions)
  return new TwitterMediaObserver(observerOptions)
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

const featureToObserverOptions: Factory<FeatureSettings, ObserverOptions> = ({
  autoRevealNsfw,
}) => ({
  autoRevealNsfw: autoRevealNsfw,
})

featureSettingsRepo.get().then(feature => {
  monitorKeyboardByFlag(feature.keyboardShortcut)
  const observer = useObserver(featureToObserverOptions(feature))
  if (!observer) return

  window.addEventListener(
    'focus',
    (() => {
      let hasFocused = false
      return () => {
        monitorKeyboardByFlag(feature.keyboardShortcut)
        observer.initialize()
        if (!hasFocused) {
          observer.observe()
          hasFocused = true
        }
      }
    })()
  )

  observer.observe()
  return feature
})

const responseTypeByEndpoint = new Map<string, ResponseType>([
  ['TweetDetail', ResponseType.TweetDetail],
  ['TweetResultByRestId', ResponseType.TweetResultByRestId],
  ['UserTweets', ResponseType.UserTweets],
  ['UserMedia', ResponseType.UserMedia],
  ['HomeTimeline', ResponseType.HomeTimeline],
  ['HomeLatestTimeline', ResponseType.HomeLatestTimeline],
  ['UserArticlesTweets', ResponseType.UserArticlesTweets],
  ['UserTweetsAndReplies', ResponseType.UserTweetsAndReplies],
  ['UserHighlightsTweets', ResponseType.UserHighlightsTweets],
  ['Bookmarks', ResponseType.Bookmarks],
  ['Likes', ResponseType.Likes],
  ['CommunitiesExploreTimeline', ResponseType.CommunitiesExploreTimeline],
  ['ListLatestTweetsTimeline', ResponseType.ListLatestTweetsTimeline],
  ['SearchTimeline', ResponseType.SearchTimeline],
  ['UserOriginalsTimeline', ResponseType.UserOriginalsTimeline],
  ['SearchByRawQuery', ResponseType.SearchByRawQuery],
  ['UserRepliesTimeline', ResponseType.UserRepliesTimeline],
  ['UserRepostsTimeline', ResponseType.UserRepostsTimeline],
  ['UserVideoTimeline', ResponseType.UserVideoTimeline],
  ['UserPhotoTimeline', ResponseType.UserPhotoTimeline],
  ['likesQuery', ResponseType.LikesQuery],
  ['BookmarkTimeline', ResponseType.BookmarkTimeline],
  ['tweetNotificationsQuery', ResponseType.TweetNotificationsQuery],
  ['ListTimeline', ResponseType.ListTimeline],
  ['device_follow.json', ResponseType.NotificationsDeviceFollow],
])

// path is URL.pathname, so the endpoint is always its last segment
const detectResponseTypeByEndpoint = (path: string): ResponseType =>
  responseTypeByEndpoint.get(path.slice(path.lastIndexOf('/') + 1)) ??
  ResponseType.Unknown

/* eslint-disable no-console */
document.addEventListener('mh:media-response', async e => {
  const { path, body } = e.detail
  const type = detectResponseTypeByEndpoint(path)

  if (__DEV__) {
    if (type === ResponseType.Unknown)
      console.warn(`[MH:ContentScript] Unknown response type for ${path}`)
    else console.debug(`[MH:ContentScript] Received ${type} response ${path}`)
  }

  const response = await sendMessage(new CaptureResponseMessage({ type, body }))

  if (__DEV__ && response.status === 'error')
    console.warn(
      `[MH:ContentScript] Failed to send ${type} response: ${response.reason}`
    )
})
/* eslint-enable no-console */

runtime.onMessage.addListener((message, _sender, sendResponse) => {
  const messageResult = RequestTransactionIdMessage.validate(message)
  if (isErrorResult(messageResult)) return true

  const txIdMessage = messageResult.value
  const uuid = self.crypto.randomUUID()

  document.addEventListener(
    'mh:tx-id:response',
    function responseTxId(ev: CustomEvent<MediaHarvest.TxIdResponseDetail>) {
      const { uuid: respUUID, value } = ev.detail
      if (respUUID !== uuid) return

      sendResponse(txIdMessage.makeResponse(true, { transactionId: value }))

      document.removeEventListener('mh:tx-id:response', responseTxId)
    }
  )

  const { method, path } = txIdMessage.payload
  document.dispatchEvent(
    new CustomEvent<MediaHarvest.TxIdRequestDetail>('mh:tx-id:request', {
      detail: makePageScriptSharedObject({
        uuid,
        method,
        path,
      }),
    })
  )

  return true
})

/**
 * Creates a shared object that can be accessed by page scripts
 *
 * @see {@link https://stackoverflow.com/questions/18744224/triggering-a-custom-event-with-attributes-from-a-firefox-extension | Stackoverflow thread}
 * @see {@link https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/Sharing_objects_with_page_scripts#cloneinto | Firefox docs}
 */
function makePageScriptSharedObject<T>(
  object: T,
  options?: Parameters<typeof cloneInto<T>>[2]
): T {
  if (__FIREFOX__) {
    return cloneInto(object, window, options)
  }

  return object
}
