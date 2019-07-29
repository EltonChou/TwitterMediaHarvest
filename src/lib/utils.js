import select from 'select-dom'
import { OrigClick } from './OrigClick'


/**
 * Check the tweet has been appended or not.
 *
 * @param {HTMLElement} element A valid tweet element
 * @returns {Boolean} Is element has been appended?
 */
const isElementCanBeAppend = element => {
  return element && !element.dataset.appended
}

/**
 * Check media is exist in tweet or not.
 *
 * @param {HTMLelement} ele A valid tweet element.
 * @returns {Boolean} Media is exist in tweet or not.
 */
const hasMedia = ele => {
  return select.exists('video', ele) || select.exists('.css-9pa8cd', ele)
}

/**
 * Generate OrigClick.
 *
 * @param {Node} addedNode
 * @param {string} mode `append` or `insert`
 */
const makeOrigClick = addedNode => {
  const tweets = select.all('.tweet', addedNode)
  for (const tweet of tweets) {
    const origClick = new OrigClick(tweet)
    const origButton = origClick.makeButton()
    if (isElementCanBeAppend(tweet)) {
      const actionBar = select('[role = group]', tweet)
      tweet.dataset.appended = true
      actionBar.appendChild(origButton)
    }
  }
}

export { makeOrigClick, hasMedia }
