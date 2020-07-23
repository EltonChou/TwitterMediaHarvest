import select from 'select-dom'

const downloadState = Object.freeze({
  inProgress: 'in_progress',
  interrupted: 'interrupted',
  complete: 'complete',
})

export const isArticleStatusMode = article => {
  const articleClassLength = article.classList.length
  const isMagicLength = articleClassLength === 3 || articleClassLength === 7
  const testStatus = /^.*\/\/.*twitter.com\/.*\/status\/\d+.*(?<!photo\/\d)$/
  const url = window.location.href

  return Boolean(url.match(testStatus)) && isMagicLength
}
export const isArticleInStream = article => {
  const articleClassLength = article.classList.length
  return articleClassLength === 8 || articleClassLength === 6
}
export const isArticlePhotoMode = article => article instanceof HTMLDivElement

/**
 *
 * @param {Element} article
 * @returns {'photo' | 'status' | 'stream'} mode
 */
export const checkModeOfArticle = article => {
  if (isArticlePhotoMode(article)) return 'photo'
  if (isArticleStatusMode(article)) return 'status'
  return 'stream'
}

//TODO: THIS PART SHOULD BE MORE READBLE (CODE & DOC)

const query = Object.freeze({
  streamMediaWrapper:
    '[data-testid="tweet"] > div:nth-child(2) > div:nth-child(2) >\
     div.css-1dbjc4n:nth-last-child(2) > div.css-1dbjc4n:nth-child(1) >\
     div.css-1dbjc4n:nth-child(1)',
  statusMediaWrapper:
    'article > div > div > div > div:nth-child(3) > [class="css-1dbjc4n"] >\
     .css-1dbjc4n:nth-child(1)',
})

/**
 * Check media is exist in tweet or not.
 *
 * @param {Element} article This should be article.
 * @returns {boolean} Media is exist in tweet or not.
 */
export const articleHasMedia = article => {
  if (!article) return false

  let mediaWrapperQuery
  if (isArticleInStream(article)) mediaWrapperQuery = query.streamMediaWrapper
  if (isArticleStatusMode(article)) mediaWrapperQuery = query.statusMediaWrapper
  const mediaWrapper = select(mediaWrapperQuery, article)

  if (mediaWrapper === null) return false

  return [...mediaWrapper.childNodes].some(
    mediaContent => mediaContent.classList.length === 7
  )
}

/**
 * Check the tweet has been appended or not.
 *
 * @param {Element} element A valid tweet element
 * @returns {boolean} Is element has been appended?
 */
export const isArticleCanBeAppend = element =>
  element && !element.dataset.appended

export const isStreamLoaded = () =>
  select.exists('[role="region"]') && select.exists('article')

export const isDownloadInterrupted = ({ current, previous }) =>
  current === downloadState.interrupted && previous === downloadState.inProgress

export const isDownloadCompleted = ({ current, previous }) =>
  current === downloadState.complete && previous === downloadState.inProgress
