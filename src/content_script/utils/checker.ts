import select from 'select-dom'

export const isArticleInDetail = (article: HTMLElement) => select.exists('.tweet-detail', article)

const TweetStatusRegEx = /\/.*\/status\/\d+/
/**
 * <article role="article" data-focusable="true" tabindex="0" class="css-1dbjc4n r-18u37iz r-1ny4l3l r-1udh08x r-1yt7n81 r-ry3cjt">
 *
 * @param {HTMLElement} article
 */
export const isArticleInStatus = (article: HTMLElement) => {
  const articleClassLength = article.classList.length
  const isMagicLength = articleClassLength === 3 || articleClassLength === 7 || articleClassLength === 6
  return Boolean(window.location.pathname.match(TweetStatusRegEx)) && isMagicLength
}

/**
 * !! CAUTION: This function relied on magic number
 * <article role="article" data-focusable="true" tabindex="0" class="css-1dbjc4n r-1loqt21 r-18u37iz r-1ny4l3l r-1udh08x r-1yt7n81 r-ry3cjt r-o7ynqc r-6416eg">
 *
 * @param {HTMLElement} article
 */
export const isArticleInStream = (article: HTMLElement) => {
  const articleClassLength = article.classList.length
  return articleClassLength === 5 || articleClassLength === 9 || articleClassLength === 10
}

/**
 * @param {HTMLElement} article
 */
export const isArticlePhotoMode = (article: HTMLElement) => article instanceof HTMLDivElement

/**
 * @param {HTMLElement} article
 */
export const checkModeOfArticle = (article: HTMLElement): TweetMode => {
  if (isArticlePhotoMode(article)) return 'photo'
  if (isArticleInStatus(article)) return 'status'
  return 'stream'
}

export const isAritcleHasQuotedContent = (article: HTMLElement): boolean => select.all('time', article).length > 1

const aricleHasPhoto = (article: HTMLElement): boolean => {
  const articleAnchor: HTMLAnchorElement = select('[href*="status"]', article)
  if (!articleAnchor) return false
  const statusUrl = new URL(articleAnchor.href)
  const photoUrl = statusUrl.pathname.includes('/photo/') ? statusUrl.pathname : `${statusUrl.pathname}/photo`
  return select.exists(`[href*="${photoUrl}"]`, article)
}

const articleHasVideo = (article: HTMLElement): boolean => {
  const videoComponent =
    select('[data-testid="videoPlayer"]', article) ||
    select('[data-testid="playButton"]', article) ||
    select('[data-testid="videoComponent"]', article)
  return videoComponent ? !isInQuotedContent(videoComponent) : false
}

const isInQuotedContent = (ele: HTMLElement) => Boolean(ele.closest('[role="link"]'))

export const articleHasMedia = (article: HTMLElement) =>
  article ? articleHasVideo(article) || aricleHasPhoto(article) : false

export const isArticleCanBeAppend = (article: HTMLElement) =>
  !(select.exists('.deck-harvester', article) || select.exists('.harvester', article))

export const isStreamLoaded = () => select.exists('[role="region"]') && select.exists('article')

const fetchHost = (): string => window.location.host

/**
 * Check current page is in tweetdeck or not.
 * @returns {boolean}
 */
export const isTweetDeck = (): boolean => fetchHost() === 'tweetdeck.twitter.com'

/**
 * Check current page is in twitter or not.
 * @returns {boolean}
 */
export const isTwitter = (): boolean => {
  const host = fetchHost()
  return host === 'twitter.com' || host === 'mobile.twitter.com'
}

const ComposeTweetRegEx = /\/compose\/tweet\/?.*/
const IntentTweetRegEx = /\/intent\/tweet\/?.*/
const TweetListRegEx = /\/i\/lists\/add_member/
const RetweetsListRegEx = /\/\d+\/retweets$/
const LikesListRegEx = /\/\d+\/likes$/

/**
 * Check user is composing tweet or not.
 * @returns {boolean}
 */
export const isComposingTweet = (): boolean =>
  Boolean(window.location.pathname.match(ComposeTweetRegEx)) ||
  Boolean(window.location.pathname.match(IntentTweetRegEx))

export const isFunctionablePath = (): boolean =>
  !(
    Boolean(window.location.pathname.match(TweetListRegEx)) ||
    Boolean(window.location.pathname.match(RetweetsListRegEx)) ||
    Boolean(window.location.pathname.match(LikesListRegEx)) ||
    isComposingTweet()
  )

export const isInTweetStatus = (): boolean => Boolean(window.location.pathname.match(TweetStatusRegEx))

export const isBetaTweetDeck = (): boolean => isTweetDeck() && select.exists('#react-root')

export const isBusinessRelatedTweet = (ele: HTMLElement): boolean =>
  select.exists('[data-testid="placementTracking"]', ele) || Boolean(ele.closest('[data-testid="placementTracking"]'))

export const isDefined = (...parms: unknown[]): boolean => parms.every(v => v !== undefined)
