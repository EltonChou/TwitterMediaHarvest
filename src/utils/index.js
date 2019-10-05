import select from 'select-dom'

/**
 * Check the tweet has been appended or not.
 *
 * @param {HTMLElement} element A valid tweet element
 * @returns {Boolean} Is element has been appended?
 */
const isArticleCanBeAppend = element => {
  return element && !element.dataset.appended
}

/**
 * @function createElementFromHTML
 * @param {String} htmlString A valid html.
 * @returns {HTMLElement} A valid HTML element
 */
const createElementFromHTML = htmlString => {
  // eslint-disable-next-line no-undef
  const wrapper = document.createElement('div')
  wrapper.innerHTML = htmlString.trim()
  return wrapper.firstChild
}

/**
 * Check media is exist in tweet or not.
 *
 * @param {HTMLelement} article This should be article.
 * @returns {Boolean} Media is exist in tweet or not.
 */
const hasMedia = article => {
  if (!article) return false
  if (article.classList.length === 2) {
    return select.exists('.css-1dbjc4n.r-117bsoe', article)
  } else {
    const tweet = select('[data-testid="tweet"]', article)
    const tweetContents = [...tweet.childNodes[1].childNodes]
    return tweetContents.some(
      content =>
        content.classList.length === 2 && content.childNodes.length === 2
    )
  }
}

/**
 * Generate tweet information.
 *
 * @param {HTMLelement} article A valid tweet element.
 * @returns {JSON} tweetInfo
 */
const parseTweetInfo = article => {
  const time = select('time', article)
  const magicLink = time
    ? time.parentNode.getAttribute('href')
    : window.location.pathname
  const info = magicLink.split('/')
  return {
    screenName: info[1],
    tweetId: info[3],
  }
}

/**
 * MutationObserver
 * @param {String} element DOMSelector
 * @callback
 * @param {JSON} options MutationsObserver options
 * @returns {MutationObserver}
 */
const observeElement = (element, callback, options = { childList: true }) => {
  const observer = new MutationObserver(callback)
  if (element instanceof HTMLElement) {
    observer.observe(element, options)
  }
  if (typeof element === 'string' && select.exists(element)) {
    observer.observe(select(element), options)
  }
  return observer
}

export {
  isArticleCanBeAppend,
  hasMedia,
  createElementFromHTML,
  observeElement,
  parseTweetInfo,
}
