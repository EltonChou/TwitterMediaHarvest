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
 * FIXME: check location is permalink or not.
 * @param {HTMLelement} ele This should be article.
 * @returns {Boolean} Media is exist in tweet or not.
 */
const hasMedia = ele => {
  if (!ele) return false
  if (ele.classList.length === 2) {
    return select.exists('.css-1dbjc4n.r-117bsoe', ele)
  } else {
    const tweet = select('[data-testid="tweet"]', ele)
    const tweetEles = tweet.childNodes[1].childNodes
    for (let tweetEle of tweetEles) {
      if (tweetEle.classList.length === 2) return true
    }
    return false
  }
}

/**
 * Generate tweet information.
 *
 * @param {HTMLelement} article A valid tweet element.
 * @returns {JSON} tweetInfo
 */
function parseTweetInfo(article) {
  try {
    const magicLink = select('time', article).parentNode.getAttribute('href')
    const info = magicLink.split('/')
    return {
      screenName: info[1],
      tweetId: info[3],
    }
  } catch (error) {
    const magicLink = window.location.href
    const info = magicLink.split('/')
    return {
      screenName: info[3],
      tweetId: info[5],
    }
  }
}

/**
 * MutationObserver
 * @param {String} element DOMSelector
 * @callback
 * @param {JSON} options MutationsObserver options
 */
const observeElement = (element, callback, options = { childList: true }) => {
  if (element instanceof HTMLElement) {
    const observer = new MutationObserver(callback)
    observer.observe(element, options)
  }
  if (typeof element === 'string') {
    if (select.exists(element)) {
      // eslint-disable-next-line no-undef
      const observer = new MutationObserver(callback)
      observer.observe(select(element), options)
    }
  }
}

export {
  isArticleCanBeAppend,
  hasMedia,
  createElementFromHTML,
  observeElement,
  parseTweetInfo,
}
