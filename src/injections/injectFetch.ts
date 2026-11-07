/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
const Pattern = Object.freeze({
  tweetRelated:
    /^(?:\/i\/api)?\/graphql\/(?<queryId>.+)?\/(?<queryName>TweetDetail|TweetResultByRestId|UserTweets|UserMedia|HomeTimeline|HomeLatestTimeline|UserTweetsAndReplies|UserHighlightsTweets|UserArticlesTweets|Bookmarks|Likes|CommunitiesExploreTimeline|ListLatestTweetsTimeline|SearchTimeline|UserOriginalsTimeline|SearchByRawQuery|UserRepliesTimeline|UserRepostsTimeline|UserVideoTimeline|likesQuery|BookmarkTimeline|tweetNotificationsQuery|ListTimeline)$/,
  notificationDeviceFollow:
    /^(?:\/i\/api)?\/2\/notifications\/device_follow\.json$/,
})

const matchTweetRelatedPath = (path: string): boolean =>
  path.match(Pattern.tweetRelated) !== null ||
  path.match(Pattern.notificationDeviceFollow) !== null

const enum MediaHarvestEvent {
  MediaResponse = 'mh:media-response',
}

type TxTarget = {
  method: string
  path: string
}

const requesetPathWeakMap = new WeakMap<XMLHttpRequest, TxTarget>()

function validateUrl(url: string | URL | undefined): URL | undefined {
  if (!url) return undefined
  if (url instanceof URL) return url
  if (URL.canParse(url)) return new URL(url)
  return undefined
}

XMLHttpRequest.prototype.open = new Proxy(XMLHttpRequest.prototype.open, {
  apply(target, thisArg: XMLHttpRequest, args) {
    const [method, url] = args

    const validUrl = validateUrl(url)
    if (validUrl && matchTweetRelatedPath(validUrl.pathname)) {
      if (__DEV__)
        // eslint-disable-next-line no-console
        console.debug(`[MH:Injection] Track ${method} ${validUrl.pathname}`)

      thisArg.addEventListener('load', captureResponse)
      requesetPathWeakMap.set(thisArg, {
        method,
        path: validUrl.pathname,
      })
    }

    return Reflect.apply(target, thisArg, args)
  },
})

function captureResponse(this: XMLHttpRequest, _ev: ProgressEvent) {
  if (this.status === 200) {
    const url = URL.parse(this.responseURL)
    if (!url) return

    dispatchMediaResponse({
      path: url.pathname,
      status: this.status,
      body: this.responseText,
    })
  } else if (__DEV__) {
    // eslint-disable-next-line no-console
    console.debug(
      `[MH:Injection] Skip response ${this.responseURL} (status ${this.status})`
    )
  }
}

window.fetch = new Proxy(window.fetch, {
  apply(target, thisArg, args: Parameters<typeof fetch>) {
    const [input, init] = args
    const responsePromise: Promise<Response> = Reflect.apply(
      target,
      thisArg,
      args
    )

    const validUrl = validateUrl(
      typeof input === 'string' || input instanceof URL ? input : input.url
    )
    if (validUrl && matchTweetRelatedPath(validUrl.pathname)) {
      if (__DEV__)
        // eslint-disable-next-line no-console
        console.debug(
          `[MH:Injection] Track fetch ${init?.method ?? 'GET'} ${validUrl.pathname}`
        )

      // Registered before the page gets the promise, so `clone()` runs before
      // the page reads the body. The page always gets the original promise.
      responsePromise
        .then(async response => {
          if (response.status !== 200) {
            if (__DEV__)
              // eslint-disable-next-line no-console
              console.debug(
                `[MH:Injection] Skip response ${validUrl.pathname} (status ${response.status})`
              )
            return
          }

          const body = await response.clone().text()
          dispatchMediaResponse({
            path: validUrl.pathname,
            status: response.status,
            body,
          })
        })
        .catch(error => {
          if (__DEV__)
            // eslint-disable-next-line no-console
            console.debug(
              `[MH:Injection] Skip fetch ${validUrl.pathname}`,
              error
            )
        })
    }

    return responsePromise
  },
})

function dispatchMediaResponse(detail: MediaHarvest.MediaResponseDetail) {
  if (__DEV__)
    // eslint-disable-next-line no-console
    console.debug(
      `[MH:Injection] Capture response ${detail.path} (${detail.body.length} chars)`
    )

  document.dispatchEvent(
    new CustomEvent<MediaHarvest.MediaResponseDetail>(
      MediaHarvestEvent.MediaResponse,
      { detail }
    )
  )
}

export {}
