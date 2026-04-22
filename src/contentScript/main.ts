/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { FeatureSettingsRepository } from '#infra/repositories/featureSettings'
import { LocalExtensionStorageProxy } from '#infra/storageProxy'
import { contentScriptBus } from '#libs/contentScriptBus'
import { topicLogger } from '#libs/loggers'
import {
  CheckDownloadHistoryMessage,
  DownloadTweetMediaMessage,
  MessagePortName,
  getMessagePort,
  sendMessage,
} from '#libs/webExtMessage'
import {
  CaptureResponseMessage,
  ResponseType,
} from '#libs/webExtMessage/messages/captureResponse'
import { RequestTransactionIdMessage } from '#libs/webExtMessage/messages/requestTransactionId'
import { isSuccessResult } from '#utils/result'
import {
  TweetDeckBetaKeyboardMonitor,
  TwitterKeyboardMonitor,
} from './KeyboardMonitor'
import './main.sass'
import TweetDeckBetaObserver from './observers/TweetDeckBetaObserver'
import TwitterMediaObserver from './observers/TwitterMediaObserver'
import { initButtonListeners } from './utils/button'
import { isBetaTweetDeck, isTwitter } from './utils/checker'

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
  { type: ResponseType.HomeLatestTimeline, endpoint: 'HomeLatestTimeline' },
  { type: ResponseType.UserArticlesTweets, endpoint: 'UserArticlesTweets' },
  { type: ResponseType.UserTweetsAndReplies, endpoint: 'UserTweetsAndReplies' },
  { type: ResponseType.UserHighlightsTweets, endpoint: 'UserHighlightsTweets' },
  { type: ResponseType.Bookmarks, endpoint: 'Bookmarks' },
  { type: ResponseType.Likes, endpoint: 'Likes' },
  {
    type: ResponseType.CommunitiesExploreTimeline,
    endpoint: 'CommunitiesExploreTimeline',
  },
  {
    type: ResponseType.ListLatestTweetsTimeline,
    endpoint: 'ListLatestTweetsTimeline',
  },
  {
    type: ResponseType.SearchTimeline,
    endpoint: 'SearchTimeline',
  },
  {
    type: ResponseType.NotificationsDeviceFollow,
    endpoint: 'device_follow.json',
  },
]

const detectResponseTypeByEndpoint = (path: string): ResponseType => {
  for (const { type, endpoint } of responseTypeCriterias) {
    if (path.endsWith(endpoint)) return type
  }

  return ResponseType.Unknown
}

initButtonListeners()

document.addEventListener('mh:media-response', async e => {
  await sendMessage(
    new CaptureResponseMessage({
      type: detectResponseTypeByEndpoint(e.detail.path),
      body: e.detail.body,
    })
  )
})

document.addEventListener(
  'mh:tx-id:response',
  function responseTxId(ev: CustomEvent<MediaHarvest.TxIdResponseDetail>) {
    const { path, method, value } = ev.detail
    const txMessage = new RequestTransactionIdMessage({ path, method })
    const { port } = getMessagePort(MessagePortName.ContentScript)
    port.postMessage(txMessage.makeResponse(true, { transactionId: value }))
  }
)

const portLogger = topicLogger('port')
const { port: mainPort } = getMessagePort(MessagePortName.ContentScript)
const handlePortMessage = (msg: unknown) => {
  if (__DEV__) portLogger.debug('received message', msg)

  if (DownloadTweetMediaMessage.isResponse(msg)) {
    const tweetId = msg.status === 'ok' ? msg.payload.tweetId : msg.tweetId
    if (typeof tweetId !== 'string') return

    const event = new CustomEvent(
      msg.status === 'ok'
        ? 'mh:download:has-downloaded'
        : 'mh:download:is-failed',
      { detail: { tweetId } }
    )
    if (__DEV__) portLogger.debug(`dispatching ${event.type}`, { tweetId })
    contentScriptBus.dispatchEvent(event)
    return
  }

  if (CheckDownloadHistoryMessage.isResponse(msg)) {
    if (msg.status !== 'ok' || !msg.payload.isExist) return

    const tweetId = msg.payload.tweetId
    const event = new CustomEvent('mh:download:has-downloaded', {
      detail: { tweetId },
    })
    if (__DEV__)
      portLogger.debug(`dispatching ${event.type}`, {
        tweetId,
      })
    contentScriptBus.dispatchEvent(event)
    return
  }

  const txIdRequestResult = RequestTransactionIdMessage.validate(msg)
  if (isSuccessResult(txIdRequestResult)) {
    const { method, path } = txIdRequestResult.value.payload
    document.dispatchEvent(
      new CustomEvent<MediaHarvest.TxIdRequestDetail>('mh:tx-id:request', {
        detail: makePageScriptSharedObject({
          method,
          path,
        }),
      })
    )
  }
}

mainPort.onMessage.addListener(handlePortMessage)

/**
 * Creates a shared object that can be accessed by page scripts
 *
 * @see {@link https://stackoverflow.com/questions/18744224/triggering-a-custom-event-with-attributes-from-a-firefox-extension | Stackoverflow thread}
 * @see {@link https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/Sharing_objects_with_page_scripts#cloneinto | Firefox docs}
 */
function makePageScriptSharedObject<T>(
  object: T,
  options?: { cloneFunctions?: boolean; wrapReflectors?: boolean }
): T {
  if (__FIREFOX__) {
    return cloneInto(object, window, options)
  }

  return object
}
