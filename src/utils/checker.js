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
export const isArticleInStream = article => article.classList.length === 8
export const isArticlePhotoMode = article => article instanceof HTMLDivElement

/**
 *
 * @param {Element} article
 * @returns {'photo' | 'status' | 'stream'} mode
 */
export const checkMode = article => {
  if (isArticlePhotoMode(article)) return 'photo'
  if (isArticleStatusMode(article)) return 'status'
  return 'stream'
}

//TODO: THIS PART SHOULD BE MORE READBLE (CODE & DOC)

const STREAM_MEDIA_QUERY = ':scope > [class="css-1dbjc4n"]'
const STATUS_MEDIA_WRAPPER_QUERY =
  'article > div > div > div > div:nth-child(3) > div:nth-child(2)'

const checkMediaInStatusAritcle = article => {
  const mediaContents = [
    ...select(STATUS_MEDIA_WRAPPER_QUERY, article).childNodes,
  ]
  return mediaContents.some(content => {
    if (content.classList.length === 2)
      return content.childNodes[0].classList.length === 7
  })
}

const checkMediaInStreamArticle = article => {
  const tweet = select('[data-testid="tweet"]', article)

  const tweetContents = tweet.childNodes[1].childNodes[1]
  const mediaWrapper = select.all(STREAM_MEDIA_QUERY, tweetContents)[1]

  return [...mediaWrapper.childNodes[0].childNodes].some(
    mediaContent => mediaContent.classList.length === 2
  )
}

/**
 * Check media is exist in tweet or not.
 *
 * FIXME: 4 types of article
 * 1. Stream
 * 2. Status 19s
 * 3. Status
 * 4. Modal
 *
 * @param {Element} article This should be article.
 * @returns {boolean} Media is exist in tweet or not.
 */
export const hasMedia = article => {
  if (!article) return false
  try {
    if (isArticleInStream(article)) return checkMediaInStreamArticle(article)
    if (isArticleStatusMode(article)) return checkMediaInStatusAritcle(article)
    if (!isArticleStatusMode(article)) return checkMediaInStreamArticle(article)
  } catch (error) {
    return false
  }
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
