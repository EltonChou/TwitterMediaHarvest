import select from 'select-dom'

const downloadState = Object.freeze({
  inProgress: 'in_progress',
  interrupted: 'interrupted',
  complete: 'complete',
})

export const isArticleInDetail = article =>
  select.exists('.tweet-detail', article)

/**
 * <article role="article" data-focusable="true" tabindex="0" class="css-1dbjc4n r-18u37iz r-1ny4l3l r-1udh08x r-1yt7n81 r-ry3cjt">
 *
 * @param {HTMLElement} article
 */
export const isArticleInStatus = article => {
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
export const isArticleInStream = article => {
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
export const isArticlePhotoMode = article => article instanceof HTMLDivElement

/**
 * @param {HTMLElement} article
 * @returns {'photo' | 'status' | 'stream'} mode
 */
export const checkModeOfArticle = article => {
  if (isArticlePhotoMode(article)) return 'photo'
  if (isArticleInStatus(article)) return 'status'
  return 'stream'
}

const query = Object.freeze({
  streamMediaWrapper:
    'div:nth-child(2) > div:nth-child(2) > div:nth-child(2) [aria-labelledby^="id__"]',
  statusMediaWrapper:
    'article > div > div > div > div:nth-child(3) [aria-labelledby^="id__"]',
})

/**
 * @param {HTMLElement} article This should be article.
 */
export const articleHasMedia = article => {
  if (!article) return false

  let mediaWrapperQuery
  if (isArticleInStream(article)) mediaWrapperQuery = query.streamMediaWrapper
  if (isArticleInStatus(article)) mediaWrapperQuery = query.statusMediaWrapper
  const mediaWrapper = select(mediaWrapperQuery, article)

  if (mediaWrapper === null) return false

  const checkContent = mediaContent => {
    // const magicLength = mediaContent.classList.length >= 1
    const photoContent = select.exists(
      '[role="link"][href*="photo"]',
      mediaContent
    )
    const videoContent = select.exists('[role="progressbar"]', mediaContent)

    return photoContent || videoContent
  }

  return [...mediaWrapper.childNodes].some(checkContent)
}

/**
 * @param {HTMLElement} article
 */
export const isArticleCanBeAppend = article =>
  article && !article.dataset.harvestAppended

export const isStreamLoaded = () =>
  select.exists('[role="region"]') && select.exists('article')

/**
 * @param {chrome.downloads.StringDelta} param0 - downloadStateDelta
 */
export const isDownloadInterrupted = ({ current, previous }) =>
  current === downloadState.interrupted && previous === downloadState.inProgress

/**
 * @param {chrome.downloads.StringDelta} param0 - downloadStateDelta
 */
export const isDownloadCompleted = ({ current, previous }) =>
  current === downloadState.complete && previous === downloadState.inProgress

/**
 * @typedef {import('./libs/TwitterMediaFile').tweetInfo} tweetInfo
 * @param {tweetInfo} tweetInfo twitter information
 */
export const isInvalidInfo = tweetInfo =>
  !tweetInfo.screenName.length || !tweetInfo.tweetId.length

/**
 * Check current page is in tweetdeck or not.
 * @returns {boolean}
 */
export const isTweetDeck = () =>
  window.location.host === 'tweetdeck.twitter.com'

/**
 * Check current page is in twitter or not.
 * @returns {boolean}
 */
export const isTwitter = () => window.location.host === 'twitter.com'
