import { FetchTweetBase, type MakeHeaderParams } from './abstractFetchTweet'

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

export class GuestFetchTweet extends FetchTweetBase {
  readonly identity: string = 'guest'

  makeHeaders({ bearerToken, csrfToken }: MakeHeaderParams): Headers {
    return new Headers([
      ['Content-Type', 'application/json'],
      ['Authorization', 'Bearer ' + bearerToken],
      ['User-Agent', navigator.userAgent],
      ['x-twitter-active-user', 'yes'],
      ['x-csrf-token', csrfToken],
      ['x-guest-token', csrfToken],
    ])
  }

  makeEndpoint(tweetId: string): string {
    const endpoint = new URL(
      'https://x.com/i/api/graphql/0hWvDhmW8YQ-S_ib3azIrw/TweetResultByRestId'
    )
    endpoint.searchParams.append('features', JSON.stringify(featureParams))
    endpoint.searchParams.append('fieldToggles', JSON.stringify(fieldTogglesParams))
    endpoint.searchParams.append('variables', JSON.stringify(makeVariableParams(tweetId)))
    return endpoint.href
  }
}
