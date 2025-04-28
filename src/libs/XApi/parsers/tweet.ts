/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { Tweet } from '#domain/valueObjects/tweet'
import { TweetUser } from '#domain/valueObjects/tweetUser'
import { TweetWithContent } from '#domain/valueObjects/tweetWithContent'
import { isMediaTweet } from './refinement'
import { makeEmptyMediaCollection, parseMedias } from './tweetMedia'

export const parseTweet = (tweetResult: XApi.Tweet): TweetWithContent => {
  const media = isMediaTweet(tweetResult)
    ? parseMedias(tweetResult.legacy.extended_entities.media)
    : makeEmptyMediaCollection()

  const user = new TweetUser({
    displayName: tweetResult.core.user_results.result.legacy.name,
    screenName: tweetResult.core.user_results.result.legacy.screen_name,
    isProtected: tweetResult.core.user_results.result.legacy.protected ?? false,
    userId: tweetResult.core.user_results.result.rest_id,
  })

  const tweet = new Tweet({
    createdAt: new Date(tweetResult.legacy.created_at),
    id: tweetResult.legacy.id_str,
    videos: media.videos,
    images: media.images,
    user: user,
    hashtags: tweetResult.legacy.entities.hashtags.map(hashtag => hashtag.text),
  })

  return new TweetWithContent({
    tweet,
    content: tweetResult.legacy.full_text,
  })
}
