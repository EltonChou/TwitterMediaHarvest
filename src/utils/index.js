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
 * @param {HTMLelement} ele This should be article.
 * @returns {Boolean} Media is exist in tweet or not.
 */
const hasMedia = ele => {
  const result = select.exists('div > div > div > div:nth-child(3)', ele)
  return result
}

/**
 * MutationObserver
 * @param {String} element DOMSelector
 * @callback
 * @param {JSON} options MutationsObserver options
 */
const observeElement = (element, callback, options = { childList: true }) => {
  if (typeof element === 'object') {
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

export { isArticleCanBeAppend, hasMedia, createElementFromHTML, observeElement }
