/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import Joi from 'joi'

export const isTimelineAddEntries = (
  instruction: XApi.V2.Instruction
): instruction is XApi.V2.TimelineAddEntries =>
  instruction.__typename === 'TimelineAddEntries'

export const isTimelinePinEntry = (
  instruction: XApi.V2.Instruction
): instruction is XApi.V2.TimelinePinEntry =>
  instruction.__typename === 'TimelinePinEntry'

export const isTimelineTimelineItem = (
  content: XApi.V2.EntryContent
): content is XApi.V2.TimelineTimelineItem =>
  content.__typename === 'TimelineTimelineItem'

export const isTimelineTimelineModule = (
  content: XApi.V2.EntryContent
): content is XApi.V2.TimelineTimelineModule =>
  content.__typename === 'TimelineTimelineModule'

export const isTimelineTweet = (
  content: XApi.V2.ItemContent
): content is XApi.V2.TimelineTweet => content.__typename === 'TimelineTweet'

export const isTweetWithVisibilityResults = (
  item: { __typename: string } | undefined
): item is XApi.V2.TweetWithVisibilityResults =>
  item?.__typename === 'TweetWithVisibilityResults' &&
  typeof (item as XApi.V2.TweetWithVisibilityResults).tweet === 'object'

export const isMediaTweet = (tweet: XApi.V2.Tweet): boolean =>
  (tweet.media_entities2?.length ?? 0) > 0

const userSchema: Joi.ObjectSchema<XApi.V2.User> = Joi.object({
  __typename: Joi.valid('User').required(),
  rest_id: Joi.string().required(),
  core: Joi.object({
    name: Joi.string().allow('').required(),
    screen_name: Joi.string().required(),
  })
    .required()
    .unknown(true),
  privacy: Joi.object({
    protected: Joi.boolean().required(),
  })
    .required()
    .unknown(true),
}).unknown(true)

// Validates every field `parseTweet` reads.
const tweetSchema: Joi.ObjectSchema<XApi.V2.Tweet> = Joi.object({
  __typename: Joi.valid('Tweet').required(),
  rest_id: Joi.string().required(),
  core: Joi.object({
    user_results: Joi.object({ result: userSchema.required() })
      .required()
      .unknown(true),
  })
    .required()
    .unknown(true),
  details: Joi.object({
    created_at_ms: Joi.number().required(),
    full_text: Joi.string().allow('').required(),
    hashtag_entities: Joi.array().optional(),
  })
    .required()
    .unknown(true),
  media_entities2: Joi.array().optional(),
}).unknown(true)

export const isTweet = (item: unknown): item is XApi.V2.Tweet =>
  tweetSchema.validate(item).error === undefined
