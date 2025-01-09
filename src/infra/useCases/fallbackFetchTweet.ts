import { FetchTweetBase } from './abstractFetchTweet'
import type { MakeHeaderParams } from './abstractFetchTweet'

const makeVariableParams = (tweetId: string) => ({
  focalTweetId: tweetId,
  with_rux_injections: false,
  includePromotedContent: false,
  withCommunity: false,
  withQuickPromoteEligibilityTweetFields: false,
  withBirdwatchNotes: false,
  withVoice: false,
  withV2Timeline: true,
})

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

export class FallbackFetchTweet extends FetchTweetBase {
  readonly identity: string = 'fallback'

  makeHeaders({ bearerToken, csrfToken }: MakeHeaderParams): Headers {
    return new Headers([
      ['Content-Type', 'application/json'],
      ['Authorization', 'Bearer ' + bearerToken],
      ['User-Agent', navigator.userAgent],
      ['x-twitter-active-user', 'yes'],
      ['x-csrf-token', csrfToken],
      ['x-twitter-auth-type', 'OAuth2Session'],
    ])
  }
  makeEndpoint(tweetId: string): string {
    const endpoint = new URL(
      'https://x.com/i/api/BbCrSoXIR7z93lLCVFlQ2Q/TweetDetail'
    )
    endpoint.searchParams.append('features', JSON.stringify(featureParams))
    endpoint.searchParams.append(
      'variables',
      JSON.stringify(makeVariableParams(tweetId))
    )
    return endpoint.href
  }
}
