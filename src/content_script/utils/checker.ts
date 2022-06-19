import select from 'select-dom'

export const isArticleInDetail = (article: HTMLElement) =>
  select.exists('.tweet-detail', article)

/**
 * <article role="article" data-focusable="true" tabindex="0" class="css-1dbjc4n r-18u37iz r-1ny4l3l r-1udh08x r-1yt7n81 r-ry3cjt">
 *
 * @param {HTMLElement} article
 */
export const isArticleInStatus = (article: HTMLElement) => {
  const articleClassLength = article.classList.length
  const isMagicLength =
    articleClassLength === 3 ||
    articleClassLength === 7 ||
    articleClassLength === 6
  const testStatus = /^.*\/\/.*twitter.com\/.*\/status\/\d+.*(?<!photo\/\d)$/
  const url = window.location.href

  return Boolean(url.match(testStatus)) && isMagicLength
}

/**
 * !! CAUTION: This function relied on magic number
 * <article role="article" data-focusable="true" tabindex="0" class="css-1dbjc4n r-1loqt21 r-18u37iz r-1ny4l3l r-1udh08x r-1yt7n81 r-ry3cjt r-o7ynqc r-6416eg">
 *
 * @param {HTMLElement} article
 */
export const isArticleInStream = (article: HTMLElement) => {
  const articleClassLength = article.classList.length
  return (
    articleClassLength === 5 ||
    articleClassLength === 9 ||
    articleClassLength === 10
  )
}

/**
 * @param {HTMLElement} article
 */
export const isArticlePhotoMode = (article: HTMLElement) =>
  article instanceof HTMLDivElement

/**
 * @param {HTMLElement} article
 */
export const checkModeOfArticle = (article: HTMLElement): TweetMode => {
  if (isArticlePhotoMode(article)) return 'photo'
  if (isArticleInStatus(article)) return 'status'
  return 'stream'
}

enum Query {
  StreamMediaWrapper = 'div:nth-child(2) > div:nth-child(2) > div:nth-child(2) [aria-labelledby^="id__"]',
  StatusMediaWrapper = 'article > div > div > div > div:nth-child(3) [aria-labelledby^="id__"]',
}

/**
 * @param {ParentNode} article This should be article.
 */
export const articleHasMedia = (article: HTMLElement) => {
  if (!article) return false

  let mediaWrapperQuery: Query
  if (isArticleInStream(article)) mediaWrapperQuery = Query.StreamMediaWrapper
  if (isArticleInStatus(article)) mediaWrapperQuery = Query.StatusMediaWrapper
  const mediaWrapper = select(mediaWrapperQuery, article)

  if (!mediaWrapper) return false

  const checkContent = (mediaContent: Element) => {
    // const magicLength = mediaContent.classList.length >= 2
    if (mediaContent.hasAttribute('id')) return false
    const photoContent = select.exists(
      '[role="link"][href*="photo"]',
      mediaContent
    )
    const videoContent = (select.exists('[role="progressbar"]', mediaContent)
      || select.exists('[data-testid="videoPlayer"]', mediaContent))

    // return magicLength && (photoContent || videoContent)
    return photoContent
      || videoContent
      && !select.exists('[role="link"]', mediaContent)
  }

  return [...mediaWrapper.children].some(checkContent)
}

/**
 * @param {HTMLElement} article
 */
export const isArticleCanBeAppend = (article: HTMLElement) => !select.exists('.harvester', article)
// article && !article.dataset.harvestAppended

export const isStreamLoaded = () =>
  select.exists('[role="region"]') && select.exists('article')

const fetchHost = (): string => window.location.host
/**
 * Check current page is in tweetdeck or not.
 * @returns {boolean}
 */
export const isTweetDeck = (): boolean =>
  fetchHost() === 'tweetdeck.twitter.com'

/**
 * Check current page is in twitter or not.
 * @returns {boolean}
 */
export const isTwitter = (): boolean => {
  const host = fetchHost()
  return host === 'twitter.com' || host === 'mobile.twitter.com'
}
