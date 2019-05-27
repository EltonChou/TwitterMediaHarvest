import select from 'select-dom'
import { OrigClick } from './OrigClick'

export const makeOrigClick = (addedNode, mode = 'append') => {
  const tweets = select.all('.tweet', addedNode)
  for (const tweet of tweets) {
    const origClick = new OrigClick(tweet)
    const origButton = origClick.makebutton()
    if (isElementCanBeAppend(tweet)) {
      const theTweet = select('.ProfileTweet-actionList.js-actions', tweet)
      tweet.dataset.appended = true
      if (mode === 'append') {
        theTweet.appendChild(origButton)
      }
      if (mode === 'insert') {
        theTweet.insertBefore(origButton, theTweet.childNodes[9])
      }
    }
  }
}

/**
 *
 * @param {HTMLElement} element
 * @returns {Boolean} Is element has been appended?
 */
function isElementCanBeAppend(element) {
  return element && !element.dataset.appended
}
