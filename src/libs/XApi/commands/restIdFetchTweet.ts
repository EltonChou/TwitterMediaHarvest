/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { FetchTweetCommand, FetchTweetCommandInput } from './abstractFetchTweet'
import { AuthType } from './graphql'
import { HttpMethod } from './types'
import { fromNullable } from 'fp-ts/lib/Either'
import { pipe } from 'fp-ts/lib/function'

const makeVariableParams = (tweetId: string) => ({
  tweetId: tweetId,
  withCommunity: false,
  includePromotedContent: false,
  withVoice: false,
})

const featureParams = {
  creator_subscriptions_tweet_preview_api_enabled: false,
  tweetypie_unmention_optimization_enabled: true,
  responsive_web_edit_tweet_api_enabled: true,
  graphql_is_translatable_rweb_tweet_is_translatable_enabled: false,
  view_counts_everywhere_api_enabled: false,
  longform_notetweets_consumption_enabled: true,
  responsive_web_twitter_article_tweet_consumption_enabled: false,
  tweet_awards_web_tipping_enabled: false,
  freedom_of_speech_not_reach_fetch_enabled: true,
  standardized_nudges_misinfo: false,
  tweet_with_visibility_results_prefer_gql_limited_actions_policy_enabled: true,
  longform_notetweets_rich_text_read_enabled: false,
  longform_notetweets_inline_media_enabled: false,
  responsive_web_graphql_exclude_directive_enabled: true,
  verified_phone_label_enabled: false,
  responsive_web_media_download_video_enabled: false,
  responsive_web_graphql_skip_user_profile_image_extensions_enabled: false,
  responsive_web_graphql_timeline_navigation_enabled: false,
  responsive_web_enhance_cards_enabled: false,
}

const fieldTogglesParams = {
  withArticleRichContentState: false,
  withAuxiliaryUserLabels: false,
}

export class RestIdFetchTweetCommand extends FetchTweetCommand {
  readonly authType = AuthType.Auth

  constructor(config: FetchTweetCommandInput) {
    super(config, {
      id: '0hWvDhmW8YQ-S_ib3azIrw',
      name: 'TweetResultByRestId',
      method: HttpMethod.Get,
      params: {
        variable: makeVariableParams(config.tweetId),
        feature: featureParams,
        fieldToggles: fieldTogglesParams,
      },
    })
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  protected getResultFromBody(body: any) {
    return pipe(
      body?.data?.tweetResult?.result,
      fromNullable('Failed to get result')
    )
  }
}
