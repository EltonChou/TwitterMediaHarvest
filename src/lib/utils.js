import select from 'select-dom'
import { OrigClick } from './OrigClick'

export const makeOrigClick = (addedNode, mode = 'append') => {
  const tweets = select.all('.tweet', addedNode)
  for (const tweet of tweets) {
    const origClick = new OrigClick(tweet)
    const origButton = origClick.makebutton()
    if (isElementCanBeAppend(tweet)) {
      if (mode === 'append') {
        tweet.dataset.appended = true
        select('.ProfileTweet-actionList.js-actions', tweet).appendChild(
          origButton
        )
      }
      if (mode === 'insert') {
        tweet.dataset.appended = true
        const ele = select('.ProfileTweet-actionList.js-actions', tweet)
        ele.insertBefore(origButton, ele.childNodes[9])
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
