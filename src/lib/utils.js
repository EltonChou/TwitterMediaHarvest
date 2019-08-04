import select from 'select-dom'
import { OrigClick } from './OrigClick'

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
 * Check media is exist in tweet or not.
 *
 * @param {HTMLelement} ele This should be article.
 * @returns {Boolean} Media is exist in tweet or not.
 */
const hasMedia = ele => {
  return select('.css-1dbjc4n.r-156q2ks > .css-1dbjc4n.r-1udh08x', ele)
}

/**
 * Generate OrigClick.
 *
 * @param {Node} addedNode
 * @param {string} mode `append` or `insert`
 */
const makeOrigClick = article => {
  console.log(article)
  const origClick = new OrigClick(article)
  const origButton = origClick.makeButton()
  if (isArticleCanBeAppend(article)) {
    const actionBar = article.lastChild.lastChild.lastChild
    article.dataset.appended = true
    actionBar.appendChild(origButton)
  }
}

export { makeOrigClick, hasMedia }
