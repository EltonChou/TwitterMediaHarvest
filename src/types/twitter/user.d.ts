export interface TweetUser {
  __typename: string
  id: string
  rest_id: string
  affiliates_highlighted_label: AffiliatesHighlightedLabel
  has_graduated_access: boolean
  is_blue_verified: boolean
  legacy: Legacy
  has_nft_avatar: boolean
  super_follow_eligible: boolean
  super_followed_by: boolean
  super_following: boolean
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface AffiliatesHighlightedLabel {}

export interface Legacy {
  blocked_by: boolean
  blocking: boolean
  follow_request_sent: boolean
  followed_by: boolean
  following: boolean
  muting: boolean
  notifications: boolean
  protected: boolean
  can_dm: boolean
  can_media_tag: boolean
  created_at: string
  default_profile: boolean
  default_profile_image: boolean
  description: string
  entities: Entities
  fast_followers_count: number
  favourites_count: number
  followers_count: number
  friends_count: number
  has_custom_timelines: boolean
  is_translator: boolean
  listed_count: number
  location: string
  media_count: number
  name: string
  normal_followers_count: number
  pinned_tweet_ids_str: string[]
  possibly_sensitive: boolean
  profile_banner_url: string
  profile_image_url_https: string
  profile_interstitial_type: string
  screen_name: string
  statuses_count: number
  translator_type: string
  verified: boolean
  want_retweets: boolean
  withheld_in_countries: any[]
}

export interface Entities {
  description: Description
}

export interface Description {
  urls: Url[]
}

export interface Url {
  display_url: string
  expanded_url: string
  url: string
  indices: number[]
}
