import select from 'select-dom'
import '../assets/styles/main.sass'
import { makeSVG, isArticleCanBeAppend, parseTweetInfo } from '../utils'

/**
 * Generate OrigClick.
 *
 * @param {HTMLNode} addedNode
 * @param {string} mode `append` or `insert`
 */
export const makeOrigClick = (article, mode = 'stream') => {
  if (isArticleCanBeAppend(article)) {
    const origButton = OrigClick.makeButton(article, mode)
    article.dataset.appended = true

    const actionBar = select('[role="group"]', article)
    const lastAction = select('div:nth-child(5)', actionBar)

    if (mode === 'status' || mode === 'photo') actionBar.appendChild(origButton)
    if (mode === 'stream') actionBar.insertBefore(origButton, lastAction)
  }
}

const OrigClick = {
  makeButton: (article, mode = 'stream') => {
    const info = parseTweetInfo(article)
    const buttonWrapper = makeSVG(mode)

    buttonWrapper.dataset.info = JSON.stringify(info)
    buttonWrapper.addEventListener('click', function() {
      // eslint-disable-next-line no-undef
      chrome.runtime.sendMessage(this.dataset)
    })
    return buttonWrapper
  },
}
