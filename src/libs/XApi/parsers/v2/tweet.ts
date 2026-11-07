/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { Tweet } from '#domain/valueObjects/tweet'
import { TweetUser } from '#domain/valueObjects/tweetUser'
import { TweetWithContent } from '#domain/valueObjects/tweetWithContent'
import {
  isSuccessResult,
  reduceToSuccesses,
  toErrorResult,
  toSuccessResult,
} from '#utils/result'
import { parseMedias } from '../tweetMedia'
import {
  isTimelineAddEntries,
  isTimelinePinEntry,
  isTimelineTimelineItem,
  isTimelineTimelineModule,
  isTimelineTweet,
  isTweet,
  isTweetWithVisibilityResults,
} from './refinements'

export const parseTweet = (tweet: XApi.V2.Tweet): TweetWithContent => {
  const media = parseMedias(tweet.media_entities2 ?? [])
  const user = tweet.core.user_results.result

  return new TweetWithContent({
    tweet: new Tweet({
      id: tweet.rest_id,
      createdAt: new Date(tweet.details.created_at_ms),
      images: media.images,
      videos: media.videos,
      user: new TweetUser({
        displayName: user.core.name,
        screenName: user.core.screen_name,
        isProtected: user.privacy.protected,
        userId: user.rest_id,
      }),
      hashtags: (tweet.details.hashtag_entities ?? []).map(
        hashtag => hashtag.text
      ),
    }),
    content: tweet.details.full_text,
  })
}

// ponytail: tombstones and other result types have no new-format sample yet,
// so they are rejected here. Add them when one shows.
export const retrieveTweetFromTweetResult = (
  tweetResult: XApi.V2.TweetResult
): Result<XApi.V2.Tweet> => {
  const { result } = tweetResult
  const tweet = isTweetWithVisibilityResults(result) ? result.tweet : result
  if (isTweet(tweet)) return toSuccessResult(tweet)

  const msg = `Unsupported tweet result\n${JSON.stringify(tweetResult)}`

  if (__DEV__)
    // eslint-disable-next-line no-console
    console.warn(msg)

  return toErrorResult(new Error(msg))
}

/**
 * Returns the tweet, and the retweeted tweet if it is a retweet.
 * A retweet often has no media of its own, so expand before filtering by media.
 */
export const withRetweetedTweet = (tweet: XApi.V2.Tweet): XApi.V2.Tweet[] => {
  const retweeted = tweet.legacy?.retweeted_status_results
  if (!retweeted) return [tweet]

  const result = retrieveTweetFromTweetResult(retweeted)
  return isSuccessResult(result) ? [tweet, result.value] : [tweet]
}

const itemContentsOf = (
  content: XApi.V2.EntryContent
): XApi.V2.ItemContent[] => {
  if (isTimelineTimelineItem(content)) return [content.content]
  if (isTimelineTimelineModule(content))
    return content.items.map(({ item }) => item.content)
  return []
}

export const retrieveTweetsFromEntry = (
  entry: XApi.V2.TimelineEntry
): XApi.V2.Tweet[] =>
  reduceToSuccesses(
    itemContentsOf(entry.content)
      .filter(isTimelineTweet)
      .map(({ tweet_results }) => retrieveTweetFromTweetResult(tweet_results))
  )

export const retrieveTweetsFromInstruction = (
  instruction: XApi.V2.Instruction
): XApi.V2.Tweet[] => {
  if (isTimelineAddEntries(instruction))
    return instruction.entries.flatMap(retrieveTweetsFromEntry)
  if (isTimelinePinEntry(instruction))
    return retrieveTweetsFromEntry(instruction.entry)
  return []
}
