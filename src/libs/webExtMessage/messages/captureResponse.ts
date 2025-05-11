/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { toErrorResult, toSuccessResult } from '#utils/result'
import {
  WebExtAction,
  WebExtMessage,
  WebExtMessageErrorResponse,
  WebExtMessagePayloadObject,
  WebExtMessageResponse,
} from './base'
import Joi from 'joi'

export const enum ResponseType {
  TweetDetail = 'TweetDetail',
  TweetResultByRestId = 'TweetResultByRestId',
  UserTweets = 'UserTweets',
  UserMedia = 'UserMedia',
  HomeTimeline = 'HomeTimeline',
  HomeLatestTimeline = 'HomeLatestTimeline',
  UserTweetsAndReplies = 'UserTweetsAndReplies',
  UserHighlightsTweets = 'UserHighlightsTweets',
  UserArticlesTweets = 'UserArticlesTweets',
  Bookmarks = 'Bookmarks',
  Likes = 'Likes',
  CommunitiesExploreTimeline = 'CommunitiesExploreTimeline',
  ListLatestTweetsTimeline = 'ListLatestTweetsTimeline',
  Unknown = 0,
}

type CaptureResponseMessagePayload = {
  type: ResponseType
  body: string
}

const messageSchema: Joi.ObjectSchema<
  WebExtMessagePayloadObject<
    WebExtAction.CaptureResponse,
    CaptureResponseMessagePayload
  >
> = Joi.object({
  action: Joi.valid(WebExtAction.CaptureResponse).required(),
  payload: Joi.object({
    type: Joi.string()
      .valid(
        ResponseType.TweetDetail,
        ResponseType.TweetResultByRestId,
        ResponseType.UserTweets,
        ResponseType.UserMedia,
        ResponseType.HomeTimeline,
        ResponseType.UserTweetsAndReplies,
        ResponseType.UserHighlightsTweets,
        ResponseType.UserArticlesTweets,
        ResponseType.Bookmarks,
        ResponseType.Likes,
        ResponseType.CommunitiesExploreTimeline,
        ResponseType.ListLatestTweetsTimeline,
        ResponseType.HomeLatestTimeline
      )
      .required(),
    body: Joi.string().required(),
  }).required(),
})
export class CaptureResponseMessage
  implements
    WebExtMessage<WebExtAction.CaptureResponse, CaptureResponseMessagePayload>
{
  constructor(readonly payload: CaptureResponseMessagePayload) {}

  makeResponse(isOk: true): WebExtMessageResponse
  makeResponse(isOk: false, reason: string): WebExtMessageErrorResponse
  makeResponse(
    ...args: [true] | [false, string]
  ): WebExtMessageResponse | WebExtMessageErrorResponse {
    const [isOk, reason] = args
    return isOk ? { status: 'ok' } : { status: 'error', reason: reason }
  }

  toObject(): WebExtMessagePayloadObject<
    WebExtAction.CaptureResponse,
    CaptureResponseMessagePayload
  > {
    return { action: WebExtAction.CaptureResponse, payload: this.payload }
  }

  static validate(message: unknown): Result<CaptureResponseMessage> {
    const { value, error } = messageSchema.validate(message)
    return error
      ? toErrorResult(error)
      : toSuccessResult(new CaptureResponseMessage(value.payload))
  }
}
