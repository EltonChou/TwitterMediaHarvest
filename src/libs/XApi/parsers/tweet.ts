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
import {
  Instruction,
  isMediaTweet,
  isRetweet,
  isTimelineTimelineItem,
  isTimelineTimelineModule,
  isTimelineTweet,
  isTweetResult,
  isTweetTombstone,
  isTweetVisibilityResults,
  isTypeItem,
  isUser,
} from './refinements'
import { makeEmptyMediaCollection, parseMedias } from './tweetMedia'

type TweetLikes = Array<XApi.Tweet | XApi.TweetLike>

export const parseTweet = (
  tweetResult: XApi.TweetLike | XApi.Tweet
): TweetWithContent => {
  const media = isMediaTweet(tweetResult)
    ? parseMedias(tweetResult.legacy.extended_entities.media)
    : makeEmptyMediaCollection()

  const userResult = tweetResult.core.user_results.result

  const user = new TweetUser({
    ...(isUser(userResult)
      ? {
          displayName: userResult.core.name,
          screenName: userResult.core.screen_name,
          isProtected: userResult.privacy.protected,
          userId: userResult.rest_id,
        }
      : {
          displayName: userResult.legacy.name,
          screenName: userResult.legacy.screen_name,
          isProtected: Boolean(userResult.legacy.protected),
          userId: userResult.rest_id,
        }),
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
  tweetResult: XApi.TweetLike
): TweetWithContent[] => {
  const tweets = [parseTweet(tweetResult)]

  if (isRetweet(tweetResult)) {
    const result = retrieveTweetFromTweetResult(
      tweetResult.legacy.retweeted_status_result
    )
    if (isSuccessResult(result)) tweets.push(parseTweet(result.value))
  }

  return tweets
}

export const retrieveTweetsFromInstruction = (
  instruction: XApi.Instruction
) => {
  const tweets: TweetLikes = []

  if (Instruction.isTimelineAddToModule(instruction))
    tweets.push(
      ...reduceToSuccesses(
        instruction.moduleItems.map(retrieveTweetFromModuleItem)
      )
    )

  if (Instruction.isTimelineAddEntries(instruction))
    tweets.push(
      ...instruction.entries.reduce<TweetLikes>(
        (tweets, entry) =>
          tweets.concat(retrieveTweetsFromTimelineAddEntry(entry)),
        []
      )
    )

  if (
    Instruction.isTimelinePinEntry(instruction) &&
    isTimelineTweet(instruction.entry.content.itemContent)
  ) {
    const result = retrieveTweetFromTweetResult(
      instruction.entry.content.itemContent.tweet_results
    )
    if (isSuccessResult(result)) tweets.push(result.value)
  }

  return tweets
}

export const retrieveTweetsFromTimelineAddEntry = (
  entry: XApi.TimelineAddEntry
): TweetLikes => {
  const tweets: Array<XApi.TweetLike | XApi.Tweet> = []

  if (
    isTimelineTimelineItem(entry.content) &&
    isTimelineTweet(entry.content.itemContent)
  ) {
    const result = retrieveTweetFromTweetResult(
      entry.content.itemContent.tweet_results
    )
    if (isSuccessResult(result)) tweets.push(result.value)
  }

  if (isTimelineTimelineModule(entry.content)) {
    const results = entry.content.items
      .map(threadItem => threadItem.item.itemContent)
      .filter(isTimelineTweet)
      .map(itemContent =>
        retrieveTweetFromTweetResult(itemContent.tweet_results)
      )

    tweets.push(...reduceToSuccesses(results))
  }

  return tweets
}

export const retrieveTweetFromModuleItem = (moduleItem: XApi.ModuleItem) =>
  retrieveTweetFromTweetResult(moduleItem.item.itemContent.tweet_results)

export const retrieveTweetFromTweetWithVisibilityResults = (
  dataResult: XApi.DataResult<XApi.TweetWithVisibilityResults>
) => dataResult.result.tweet

export const retrieveTweetFromTweetResult = (
  tweetResult: XApi.PosibleTweetResult
): Result<XApi.TweetLike | XApi.Tweet> => {
  if (isTweetResult(tweetResult)) return toSuccessResult(tweetResult.result)
  if (isTweetVisibilityResults(tweetResult))
    return toSuccessResult(
      retrieveTweetFromTweetWithVisibilityResults(tweetResult)
    )

  if (isTypeItem(tweetResult.result) && isTweetTombstone(tweetResult.result))
    return toErrorResult(new Error('Tombstone!'))

  const msg = `Unknown tweet result type\n${JSON.stringify(tweetResult)}`

  if (__DEV__)
    // eslint-disable-next-line no-console
    console.warn(msg)

  return toErrorResult(new Error(msg))
}
