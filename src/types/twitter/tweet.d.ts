export interface Tweet {
  bookmark_count: number
  bookmarked: boolean
  created_at: string
  conversation_id_str: string
  display_text_range: number[]
  entities: Entities
  extended_entities: ExtendedEntities
  favorite_count: number
  favorited: boolean
  full_text: string
  is_quote_status: boolean
  lang: string
  possibly_sensitive: boolean
  possibly_sensitive_editable: boolean
  quote_count: number
  reply_count: number
  retweet_count: number
  retweeted: boolean
  user_id_str: string
  id_str: string
}

interface Entities {
  hashtags: any[]
  symbols: any[]
  user_mentions: any[]
  urls: Url[]
  media: Medum[]
}

interface Url {
  url: string
  expanded_url: string
  display_url: string
  indices: number[]
}

interface Medum {
  id: number
  id_str: string
  indices: number[]
  media_url: string
  media_url_https: string
  url: string
  display_url: string
  expanded_url: string
  type: string
  original_info: OriginalInfo
  sizes: Sizes
}

interface OriginalInfo {
  width: number
  height: number
  focus_rects?: FocusRect[]
}

interface FocusRect {
  x: number
  y: number
  h: number
  w: number
}

interface Sizes {
  thumb: Thumb
  large: Large
  medium: Medium
  small: Small
}

interface Thumb {
  w: number
  h: number
  resize: string
}

interface Large {
  w: number
  h: number
  resize: string
}

interface Medium {
  w: number
  h: number
  resize: string
}

interface Small {
  w: number
  h: number
  resize: string
}

interface ExtendedEntities {
  media: Medum2[]
}

interface Medum2 {
  id: number
  id_str: string
  indices: number[]
  media_url: string
  media_url_https: string
  url: string
  display_url: string
  expanded_url: string
  type: string
  original_info: OriginalInfo2
  sizes: Sizes2
  media_key: string
  video_info?: VideoInfo
  additional_media_info?: AdditionalMediaInfo
}

interface OriginalInfo2 {
  width: number
  height: number
  focus_rects?: FocusRect2[]
}

interface FocusRect2 {
  x: number
  y: number
  h: number
  w: number
}

interface Sizes2 {
  thumb: Thumb2
  large: Large2
  medium: Medium2
  small: Small2
}

interface Thumb2 {
  w: number
  h: number
  resize: string
}

interface Large2 {
  w: number
  h: number
  resize: string
}

interface Medium2 {
  w: number
  h: number
  resize: string
}

interface Small2 {
  w: number
  h: number
  resize: string
}

interface VideoInfo {
  aspect_ratio: number[]
  duration_millis: number
  variants: Variant[]
}

interface Variant {
  content_type: string
  url: string
  bitrate?: number
}

interface AdditionalMediaInfo {
  monetizable: boolean
}

interface User {
  id: number
  id_str: string
  name: string
  screen_name: string
  location: string
  description: string
  url: string
  entities: Entities2
  protected: boolean
  followers_count: number
  fast_followers_count: number
  normal_followers_count: number
  friends_count: number
  listed_count: number
  created_at: string
  favourites_count: number
  utc_offset: any
  time_zone: any
  geo_enabled: boolean
  verified: boolean
  statuses_count: number
  media_count: number
  lang: any
  contributors_enabled: boolean
  is_translator: boolean
  is_translation_enabled: boolean
  profile_background_color: string
  profile_background_image_url: string
  profile_background_image_url_https: string
  profile_background_tile: boolean
  profile_image_url: string
  profile_image_url_https: string
  profile_banner_url: string
  profile_link_color: string
  profile_sidebar_border_color: string
  profile_sidebar_fill_color: string
  profile_text_color: string
  profile_use_background_image: boolean
  has_extended_profile: boolean
  default_profile: boolean
  default_profile_image: boolean
  pinned_tweet_ids: number[]
  pinned_tweet_ids_str: string[]
  has_custom_timelines: boolean
  following: any
  follow_request_sent: any
  notifications: any
  advertiser_account_type: string
  advertiser_account_service_levels: string[]
  business_profile_state: string
  translator_type: string
  withheld_in_countries: any[]
  require_some_consent: boolean
}

interface Entities2 {
  url: Url2
  description: Description
}

interface Url2 {
  urls: Url3[]
}

interface Url3 {
  url: string
  expanded_url: string
  display_url: string
  indices: number[]
}

interface Description {
  urls: any[]
}

interface Place {
  id: string
  url: string
  place_type: string
  name: string
  full_name: string
  country_code: string
  country: string
  contained_within: any[]
  bounding_box: BoundingBox
  attributes: Attributes
}

interface BoundingBox {
  type: string
  coordinates: number[][][]
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface Attributes {}
