/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

const xOpen = XMLHttpRequest.prototype.open
const xSetHeader = XMLHttpRequest.prototype.setRequestHeader

type TxTarget = {
  method: string
  path: string
}

const requesetPathWeakMap = new WeakMap<XMLHttpRequest, TxTarget>()

const Pattern = Object.freeze({
  tweetRelated:
    /^(\/i\/api)?\/graphql\/.+\/(TweetDetail|TweetResultByRestId|UserTweets|UserMedia|HomeTimeline|UserTweetsAndReplies|UserHighlightsTweets|UserArticlesTweets|Bookmarks|Likes|CommunitiesExploreTimeline|ListLatestTweetsTimeline)$/,
})

const enum MediaHarvestEvent {
  MediaResponse = 'mh:media-response',
  TransactionId = 'mh:tx-id',
}

XMLHttpRequest.prototype.setRequestHeader = function (
  name: string,
  value: string
) {
  xSetHeader.apply(this, [name, value])

  const lowerCaseName = name.toLowerCase()
  const txTarget = requesetPathWeakMap.get(this)

  if (lowerCaseName === 'x-client-transaction-id' && txTarget)
    document.dispatchEvent(
      new CustomEvent<MediaHarvest.ClientTxIdDetail>(
        MediaHarvestEvent.TransactionId,
        {
          detail: {
            value,
            ...txTarget,
          },
        }
      )
    )
}

XMLHttpRequest.prototype.open = function (
  method: string,
  url: string | URL,
  async: boolean = true,
  username?: string | null,
  password?: string | null
) {
  let path = ''
  if (typeof url === 'string') {
    const validUrl = URL.parse(url)
    if (validUrl) path = validUrl.pathname
  } else if (url instanceof URL) {
    path = url.pathname
  }

  if (path.match(Pattern.tweetRelated)) {
    this.addEventListener('load', captureResponse)
    requesetPathWeakMap.set(this, {
      method,
      path,
    })
  }

  xOpen.apply(this, [method, url, async, username, password])
}

function captureResponse(this: XMLHttpRequest, _ev: ProgressEvent) {
  if (this.status === 200) {
    const url = URL.parse(this.responseURL)
    if (!url) return

    const event = new CustomEvent<MediaHarvest.MediaResponseDetail>(
      MediaHarvestEvent.MediaResponse,
      {
        detail: {
          path: url.pathname,
          status: this.status,
          body: this.responseText,
        },
      }
    )

    document.dispatchEvent(event)
  }
}
