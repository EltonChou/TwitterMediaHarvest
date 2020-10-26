import select from 'select-dom'

const downloadState = Object.freeze({
  inProgress: 'in_progress',
  interrupted: 'interrupted',
  complete: 'complete',
})

/**
 * @param {HTMLElement} article
 */
export const isArticleInStatus = article => {
  const articleClassLength = article.classList.length
  const isMagicLength = articleClassLength === 3 || articleClassLength === 7
  const testStatus = /^.*\/\/.*twitter.com\/.*\/status\/\d+.*(?<!photo\/\d)$/
  const url = window.location.href

  return Boolean(url.match(testStatus)) && isMagicLength
}

/**
 * @param {HTMLElement} article
 */
export const isArticleInStream = article => {
  const articleClassLength = article.classList.length
  return articleClassLength === 8 || articleClassLength === 6
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
    '[data-testid="tweet"] > div:nth-child(2) > div:nth-child(2) >\
     div.css-1dbjc4n:nth-last-child(2) > div.css-1dbjc4n:nth-child(1) >\
     div.css-1dbjc4n:nth-child(1)',
  statusMediaWrapper:
    'article > div > div > div > div:nth-child(3) > [class="css-1dbjc4n"] >\
     [class="css-1dbjc4n"] > [class="css-1dbjc4n"]',
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
    const magicLength = mediaContent.classList.length > 7
    const photoContent = select.exists(
      '[role="link"][href*="photo"]',
      mediaContent
    )
    const videoContent = select.exists('[role="progressbar"]', mediaContent)

    return magicLength && (photoContent || videoContent)
  }

  return [...mediaWrapper.childNodes].some(checkContent)
}

/**
 * @param {HTMLElement} article
 */
export const isArticleCanBeAppend = article =>
  article && !article.dataset.appended

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
