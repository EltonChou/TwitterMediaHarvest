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

/**
 * @param {ParentNode} article This should be article.
 */
export const articleHasMedia = (article: HTMLElement) => {
  if (!article) return false
  const hasVideo =
    select.exists('[data-testid="videoPlayer"]', article) || select.exists('[data-testid="playButton"]', article)

  let hasPhoto: boolean
  const photoEle = select('[data-testid="tweetPhoto"]', article)
  if (photoEle) {
    const closestAnchor: HTMLAnchorElement = photoEle.closest('[href*="status"]')
    const articleAnchor: HTMLAnchorElement = select('[href*="status"]', article)
    hasPhoto = closestAnchor?.href.startsWith(articleAnchor.href)
  } else {
    hasPhoto = false
  }

  return hasVideo || hasPhoto
}

/**
 * @param {HTMLElement} article
 */
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

/**
 * Check user is composing tweet or not.
 * @returns {boolean}
 */
export const isComposingTweet = (): boolean =>
  Boolean(window.location.pathname.match(ComposeTweetRegEx)) ||
  Boolean(window.location.pathname.match(IntentTweetRegEx))

export const isNotFunctionPath = (): boolean => Boolean(window.location.pathname.match(TweetListRegEx))

export const isInTweetStatus = (): boolean => Boolean(window.location.pathname.match(TweetStatusRegEx))

export const isBetaTweetDeck = (): boolean => select.exists('#react-root')
