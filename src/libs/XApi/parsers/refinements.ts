/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import Joi from 'joi'

export const isTypeItem = (item: unknown): item is XApi.TypeItem =>
  item !== undefined && item !== null && Object.hasOwn(item, '__typename')

export const isTimelineTimelineModule = (
  entryContent: XApi.EntryContent
): entryContent is XApi.TimelineTimelineModule =>
  entryContent.__typename === 'TimelineTimelineModule'

export const isTimelineTimelineItem = (
  entryContent: XApi.EntryContent
): entryContent is XApi.TimelineTimelineItem =>
  entryContent.__typename === 'TimelineTimelineItem'

export const isTimelineTweet = (
  timelineItemContent: XApi.TimelineItemContent
): timelineItemContent is XApi.TimelineTweet =>
  timelineItemContent.__typename === 'TimelineTweet'

export const isMediaTweet = (
  tweet: XApi.TweetLike | XApi.Tweet
): tweet is XApi.MediaTweet => {
  const entities = tweet?.legacy?.entities ?? tweet?.legacy?.extended_entities
  if (!entities) return false
  return Object.hasOwn(entities, 'media')
}

export const isRetweet = (tweet: XApi.TweetLike): tweet is XApi.RetweetTweet =>
  'retweeted_status_result' in tweet.legacy

export const isTweetTombstone = (
  item: XApi.TypeItem
): item is XApi.TweetTombstone => item.__typename === 'TweetTombstone'

export const isTweetVisibilityResults = (
  dataResult: XApi.DataResult<unknown>
): dataResult is XApi.DataResult<XApi.TweetWithVisibilityResults> => {
  const result = dataResult?.result as Record<string, unknown>
  return result ? result?.__typename === 'TweetWithVisibilityResults' : false
}

export const isTweetResult = (
  dataResult: XApi.DataResult<unknown>
): dataResult is XApi.DataResult<XApi.Tweet> => {
  const result = dataResult?.result as Record<string, unknown>
  return result?.__typename === 'Tweet'
}

export class Instruction {
  static isTimelineAddEntries(
    instruction: XApi.Instruction
  ): instruction is XApi.TimelineAddEntries {
    return instruction.type === 'TimelineAddEntries'
  }

  static isTimelinePinEntry(
    instruction: XApi.Instruction
  ): instruction is XApi.TimelinePinEntry {
    return instruction.type === 'TimelinePinEntry'
  }

  static isTimelineAddToModule(
    instruction: XApi.Instruction
  ): instruction is XApi.TimelineAddToModule {
    return instruction.type === 'TimelineAddToModule'
  }
}

const baseUserSchema: Joi.ObjectSchema<XApi.BaseUser> = Joi.object({
  id: Joi.string().required(),
  rest_id: Joi.string().required(),
}).unknown(true)

const legacyUserSchema: Joi.ObjectSchema<XApi.LegacyUser> = Joi.object({
  legacy: Joi.object({
    name: Joi.string().required(),
    screen_name: Joi.string().required(),
    protected: Joi.bool().optional(),
  }),
}).unknown(true)

export const isLegacyUser = (user: XApi.BaseUser): user is XApi.LegacyUser => {
  const { error } = baseUserSchema.concat(legacyUserSchema).validate(user)
  return error === undefined
}

const userSchema: Joi.ObjectSchema<XApi.User> = Joi.object({
  core: Joi.object({
    name: Joi.string().required(),
    screen_name: Joi.string().required(),
    created_at: Joi.date().required(),
  }).required(),
  privacy: Joi.object({
    protected: Joi.boolean().required(),
  }).required(),
}).unknown(true)

export const isUser = (user: XApi.BaseUser): user is XApi.User => {
  const { error } = baseUserSchema.concat(userSchema).validate(user)
  return error === undefined
}
