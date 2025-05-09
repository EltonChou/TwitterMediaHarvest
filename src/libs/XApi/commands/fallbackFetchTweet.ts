/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { FetchTweetCommand } from './abstractFetchTweet'
import type { FetchTweetCommandInput } from './abstractFetchTweet'
import { AuthType } from './graphql'
import { HttpMethod } from './types'

const featureParams = {
  blue_business_profile_image_shape_enabled: false,
  responsive_web_graphql_exclude_directive_enabled: true,
  verified_phone_label_enabled: false,
  responsive_web_graphql_timeline_navigation_enabled: false,
  responsive_web_graphql_skip_user_profile_image_extensions_enabled: true,
  tweetypie_unmention_optimization_enabled: false,
  vibe_api_enabled: false,
  responsive_web_edit_tweet_api_enabled: false,
  graphql_is_translatable_rweb_tweet_is_translatable_enabled: false,
  view_counts_everywhere_api_enabled: false,
  longform_notetweets_consumption_enabled: false,
  tweet_awards_web_tipping_enabled: false,
  freedom_of_speech_not_reach_fetch_enabled: false,
  standardized_nudges_misinfo: false,
  tweet_with_visibility_results_prefer_gql_limited_actions_policy_enabled: true,
  interactive_text_enabled: false,
  responsive_web_text_conversations_enabled: false,
  longform_notetweets_rich_text_read_enabled: false,
  responsive_web_enhance_cards_enabled: false,
}

export class FallbackFetchTweet extends FetchTweetCommand {
  readonly authType = AuthType.Auth
  constructor(config: FetchTweetCommandInput) {
    super(config, {
      id: 'BbCrSoXIR7z93lLCVFlQ2Q',
      name: 'TweetDetail',
      method: HttpMethod.Get,
      params: {
        variable: {
          focalTweetId: config.tweetId,
          with_rux_injections: false,
          includePromotedContent: false,
          withCommunity: false,
          withQuickPromoteEligibilityTweetFields: false,
          withBirdwatchNotes: false,
          withVoice: false,
          withV2Timeline: true,
        },
        feature: featureParams,
      },
    })
  }
}
