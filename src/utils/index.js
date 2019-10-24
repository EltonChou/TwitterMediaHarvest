import select from 'select-dom'

/**
 *
 * @param {Element} article `tweet` element
 * @param {Element} button harvestButton
 *
 * @returns {Element} button
 */
const integrateArticleWithButton = (article, button) => {
  const info = parseTweetInfo(article)

  button = integrateDataWithButton(info, button)

  button.addEventListener('click', function() {
    // eslint-disable-next-line no-undef
    chrome.runtime.sendMessage(this.dataset)
  })
  return button
}

/**
 *
 * @param {Object} data
 * @param {Element} button
 *
 * @returns {Element}
 */
const integrateDataWithButton = (data, button) => {
  for (let key in data) {
    button.dataset[key] = data[key]
  }
  return button
}

/**
 * Check the tweet has been appended or not.
 *
 * @param {Element} element A valid tweet element
 * @returns {boolean} Is element has been appended?
 */
const isArticleCanBeAppend = element => {
  return element && !element.dataset.appended
}

/**
 * Create HTMLElement from html string.
 *
 * @param {InnerHTML} htmlString A valid html.
 * @returns {Element} A valid HTML element
 */
const createElementFromHTML = htmlString => {
  // eslint-disable-next-line no-undef
  const wrapper = document.createElement('div')
  wrapper.innerHTML = htmlString.trim()
  return wrapper.firstChild
}

/**
 *
 * @param {Element} article
 * @returns {string} mode
 */
const checkMode = article => {
  if (article instanceof HTMLDivElement) return 'photo'
  if (article.classList.length === 2) return 'status'
  return 'stream'
}

/**
 * Check media is exist in tweet or not.
 *
 * @param {Element} article This should be article.
 * @returns {boolean} Media is exist in tweet or not.
 */
const hasMedia = article => {
  if (!article) return false
  if (article.classList.length === 2) {
    // status
    const mediaContent = select('.css-1dbjc4n.r-117bsoe', article)
    return [...mediaContent.childNodes].some(
      content => content.classList.length === 2
    )
  } else {
    // stream
    const tweet = select('[data-testid="tweet"]', article)
    const tweetContents = [...tweet.childNodes[1].childNodes]
    return tweetContents.some(
      content =>
        content.classList.length === 2 && content.childNodes.length === 2
    )
  }
}

/**
 * @typedef tweetInfo
 * @type {Object}
 * @property {string} screenName
 * @property {string} tweetId
 */
/**
 * Generate tweet information.
 *
 * @param {Element} article A valid tweet element.
 * @returns {tweetInfo}
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
 * @param {MutationCallback} callback
 * @param {Object} options MutationsObserver options
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
  checkMode,
  integrateArticleWithButton,
  integrateDataWithButton,
}
