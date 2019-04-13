import select from 'select-dom'
import { OrigClick } from './OrigClick'

export const makeOrigClick = (addedNode, mode = 'append') => {
  const origClick = new OrigClick(addedNode)
  const origButton = origClick.makebutton()
  if (isElementCanBeAppend(addedNode)) {
    if (mode === 'append') {
      addedNode.dataset.appended = true
      select('.ProfileTweet-actionList.js-actions', addedNode).appendChild(
        origButton
      )
    }
    if (mode === 'insert') {
      const ele = select('.ProfileTweet-actionList.js-actions', addedNode)
      ele.insertBefore(origButton, ele.childNodes[9])
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
