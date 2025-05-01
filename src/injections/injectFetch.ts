/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

const xOpen = XMLHttpRequest.prototype.open

const Pattern = Object.freeze({
  tweetRelated:
    /^(\/i\/api)?\/graphql\/.+\/(TweetDetail|TweetResultByRestId|UserTweets|UserMedia|HomeTimeline|UserTweetsAndReplies|UserHighlightsTweets|UserArticlesTweets)$/,
})

XMLHttpRequest.prototype.open = function (
  method: string,
  url: string | URL,
  async: boolean = true,
  username?: string | null,
  password?: string | null
) {
  let path = ''

  if (typeof url === 'string') {
    const validUrl = new URL(url)
    path = validUrl.pathname
  } else if (url instanceof URL) {
    path = url.pathname
  }

  if (path.match(Pattern.tweetRelated)) {
    this.addEventListener('load', function () {
      if (this.status === 200) {
        const url = URL.parse(this.responseURL)
        if (!url) return
        const event = new CustomEvent<MediaHarvest.MediaResponseDetail>(
          'mh:media-response',
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
    })
  }

  return xOpen.apply(this, [method, url, async, username, password])
}
