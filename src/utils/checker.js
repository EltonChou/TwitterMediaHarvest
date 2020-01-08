import select from 'select-dom'

export const isArticleStatusMode = article => article.classList.length === 3
export const isArticlePhotoMode = article => article instanceof HTMLDivElement

/**
 *
 * @param {Element} article
 * @returns {string} mode
 */
export const checkMode = article => {
  if (isArticlePhotoMode(article)) return 'photo'
  if (isArticleStatusMode(article)) return 'status'
  return 'stream'
}

/**
 * Check media is exist in tweet or not.
 *
 * @param {Element} article This should be article.
 * @returns {boolean} Media is exist in tweet or not.
 */
export const hasMedia = article => {
  if (!article) return false
  try {
    if (isArticleStatusMode(article)) {
      const mediaContents = [
        ...select('.css-1dbjc4n.r-117bsoe', article).childNodes,
      ]
      return mediaContents.some(content => {
        if (content.classList.length === 2)
          return content.childNodes[0].classList.length === 6
      })
    } else {
      // stream
      const tweet = select('[data-testid="tweet"]', article)
      const tweetContents = [...tweet.childNodes[1].childNodes]
      return tweetContents.some(content => {
        if (content.classList.length === 2)
          return (
            content.childNodes[0].classList.length === 2 ||
            content.childNodes[0].classList.length === 3
          )
      })
    }
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
