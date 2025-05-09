/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { FetchTweetCommand, FetchTweetCommandInput } from './abstractFetchTweet'
import { AuthType } from './graphql'
import { HttpMethod, RequestContext } from './types'
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
  responsive_web_jetfuel_frame: false,
  responsive_web_grok_share_attachment_enabled: true,
  articles_preview_enabled: true,
  responsive_web_edit_tweet_api_enabled: true,
  graphql_is_translatable_rweb_tweet_is_translatable_enabled: true,
  view_counts_everywhere_api_enabled: true,
  longform_notetweets_consumption_enabled: true,
  responsive_web_twitter_article_tweet_consumption_enabled: true,
  tweet_awards_web_tipping_enabled: false,
  responsive_web_grok_show_grok_translated_post: false,
  responsive_web_grok_analysis_button_from_backend: true,
  creator_subscriptions_quote_tweet_preview_enabled: false,
  freedom_of_speech_not_reach_fetch_enabled: true,
  standardized_nudges_misinfo: true,
  tweet_with_visibility_results_prefer_gql_limited_actions_policy_enabled: true,
  longform_notetweets_rich_text_read_enabled: true,
  longform_notetweets_inline_media_enabled: true,
  profile_label_improvements_pcf_label_in_post_enabled: true,
  rweb_tipjar_consumption_enabled: true,
  responsive_web_graphql_exclude_directive_enabled: true,
  verified_phone_label_enabled: false,
  responsive_web_grok_image_annotation_enabled: true,
  responsive_web_graphql_skip_user_profile_image_extensions_enabled: false,
  responsive_web_graphql_timeline_navigation_enabled: true,
  responsive_web_enhance_cards_enabled: false,
}

const fieldTogglesParams = {
  withArticleRichContentState: true,
  withArticlePlainText: false,
  withGrokAnalyze: false,
  withDisallowedReplyControls: false,
}

/**
 * This command only works when csrf token (aka guest token) is all numbers.
 */
export class GuestFetchTweetCommand extends FetchTweetCommand {
  readonly authType = AuthType.Guest
  readonly rootPath: string = '/graphql/'

  constructor(config: FetchTweetCommandInput) {
    super(config, {
      id: 'Vg2Akr5FzUmF0sTplA5k6g',
      name: 'TweetResultByRestId',
      method: HttpMethod.Get,
      params: {
        variable: makeVariableParams(config.tweetId),
        feature: featureParams,
        fieldToggles: fieldTogglesParams,
      },
    })
  }

  async prepareRequest(context: RequestContext): Promise<Request> {
    return super.prepareRequest({ ...context, hostname: 'api.x.com' })
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  protected getResultFromBody(body: any) {
    return pipe(
      body?.data?.tweetResult?.result,
      fromNullable('Failed to get result')
    )
  }
}
