/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { Tweet } from '#domain/valueObjects/tweet'
import { TweetUser } from '#domain/valueObjects/tweetUser'
import { TweetWithContent } from '#domain/valueObjects/tweetWithContent'
import {
  Instruction,
  isMediaTweet,
  isRetweet,
  isTimelineTimelineItem,
  isTimelineTimelineModule,
  isTimelineTweet,
} from './refinements'
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

export const eagerParseTweet = (
  tweetResult: XApi.Tweet
): TweetWithContent[] => {
  const tweets = [parseTweet(tweetResult)]
  if (isRetweet(tweetResult))
    tweets.push(parseTweet(tweetResult.legacy.retweeted_status_result.result))
  return tweets
}

export const retrieveTweetsFromInstruction = (
  instruction: XApi.Instruction
) => {
  const tweets: XApi.Tweet[] = []

  if (Instruction.isTimelineAddToModule(instruction))
    tweets.push(...instruction.moduleItems.map(retrieveTweetFromModuleItem))

  if (Instruction.isTimelineAddEntries(instruction))
    tweets.push(
      ...instruction.entries.reduce<XApi.Tweet[]>(
        (tweets, entry) =>
          tweets.concat(retrieveTweetsFromTimelineAddEntry(entry)),
        []
      )
    )

  if (
    Instruction.isTimelinePinEntry(instruction) &&
    isTimelineTweet(instruction.entry.content.itemContent)
  )
    tweets.push(instruction.entry.content.itemContent.tweet_results.result)

  return tweets
}

export const retrieveTweetsFromTimelineAddEntry = (
  entry: XApi.TimelineAddEntry
) => {
  const tweets: XApi.Tweet[] = []

  if (
    isTimelineTimelineItem(entry.content) &&
    isTimelineTweet(entry.content.itemContent)
  )
    tweets.push(entry.content.itemContent.tweet_results.result)

  if (isTimelineTimelineModule(entry.content))
    tweets.push(
      ...entry.content.items
        .map(threadItem => threadItem.item.itemContent)
        .filter(isTimelineTweet)
        .map(itemContent => itemContent.tweet_results.result)
    )

  return tweets
}

export const retrieveTweetFromModuleItem = (moduleItem: XApi.ModuleItem) =>
  moduleItem.item.itemContent.tweet_results.result
