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
  return select(
    'div.css-1dbjc4n.r-18u37iz.r-thb0q2 > div.css-1dbjc4n.r-1iusvr4.r-46vdb2.r-5f2r5o.r-bcqeeo > div.css-1dbjc4n.r-19i43ro > div.css-1dbjc4n.r-156q2ks',
    ele
  )
}

/**
 * Generate OrigClick.
 *
 * @param {Node} addedNode
 * @param {string} mode `append` or `insert`
 */
const makeOrigClick = (article, mode = 'append') => {
  const origClick = new OrigClick(article)
  const origButton = origClick.makeButton()
  if (isArticleCanBeAppend(article)) {
    article.dataset.appended = true

    const actionBar = select(
      'div.css-1dbjc4n.r-18u37iz.r-1wtj0ep.r-156q2ks.r-1mdbhws',
      article
    )
    const lastAction = select(
      'div.css-1dbjc4n.r-1mlwlqe.r-18kxxzh.r-199wky7',
      actionBar
    )

    if (mode === 'append') actionBar.appendChild(origButton)
    if (mode === 'insert') actionBar.insertBefore(origButton, lastAction)
  }
}

export { makeOrigClick, hasMedia }
