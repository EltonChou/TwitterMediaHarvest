export const isValidTweetMediaFileUrl = (url: string): boolean => {
  const twitter_media_url_pattern =
    /^https:\/\/(?:pbs|video)\.twimg\.com\/(?:media|.*_video.*)\/.*\.(?:jpg|png|gif|mp4)$/

  return Boolean(url.match(twitter_media_url_pattern))
}
