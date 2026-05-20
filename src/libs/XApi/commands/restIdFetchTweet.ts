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
  creator_subscriptions_tweet_preview_api_enabled: true,
  premium_content_api_read_enabled: false,
  communities_web_enable_tweet_community_results_fetch: true,
  c9s_tweet_anatomy_moderator_badge_enabled: true,
  responsive_web_grok_analyze_button_fetch_trends_enabled: false,
  responsive_web_grok_analyze_post_followups_enabled: false,
  rweb_cashtags_composer_attachment_enabled: true,
  responsive_web_jetfuel_frame: true,
  responsive_web_grok_share_attachment_enabled: true,
  responsive_web_grok_annotations_enabled: true,
  articles_preview_enabled: true,
  responsive_web_edit_tweet_api_enabled: true,
  rweb_conversational_replies_downvote_enabled: false,
  graphql_is_translatable_rweb_tweet_is_translatable_enabled: true,
  view_counts_everywhere_api_enabled: true,
  longform_notetweets_consumption_enabled: true,
  responsive_web_twitter_article_tweet_consumption_enabled: true,
  content_disclosure_indicator_enabled: true,
  content_disclosure_ai_generated_indicator_enabled: true,
  responsive_web_grok_show_grok_translated_post: true,
  responsive_web_grok_analysis_button_from_backend: true,
  post_ctas_fetch_enabled: true,
  rweb_cashtags_enabled: true,
  freedom_of_speech_not_reach_fetch_enabled: true,
  standardized_nudges_misinfo: true,
  tweet_with_visibility_results_prefer_gql_limited_actions_policy_enabled: true,
  longform_notetweets_rich_text_read_enabled: true,
  longform_notetweets_inline_media_enabled: false,
  profile_label_improvements_pcf_label_in_post_enabled: true,
  responsive_web_profile_redirect_enabled: false,
  rweb_tipjar_consumption_enabled: false,
  verified_phone_label_enabled: false,
  responsive_web_grok_image_annotation_enabled: true,
  responsive_web_grok_imagine_annotation_enabled: true,
  responsive_web_grok_community_note_auto_translation_is_enabled: true,
  responsive_web_graphql_skip_user_profile_image_extensions_enabled: false,
  responsive_web_graphql_timeline_navigation_enabled: true,
}

const fieldTogglesParams = {
  withArticleRichContentState: true,
  withArticlePlainText: false,
  withArticleSummaryText: true,
  withArticleVoiceOver: true,
  withGrokAnalyze: false,
  withDisallowedReplyControls: false,
}

export class RestIdFetchTweetCommand extends FetchTweetCommand {
  readonly authType: AuthType = AuthType.Auth

  constructor(config: FetchTweetCommandInput) {
    super(config, {
      id: '2Acdg-VztGlHX7MjX67Ysw',
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
