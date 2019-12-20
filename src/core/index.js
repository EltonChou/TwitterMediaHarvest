import select from 'select-dom'
import '../assets/styles/main.sass'
import Harvester from '../lib/Harvester'
import { isArticleCanBeAppend } from '../utils/checker'
import { mixDataWithButton } from '../utils/mixer'
import { parseTweetInfo } from '../utils/parser'

const swapButton = article => {
  const info = parseTweetInfo(article)
  const previousButton = select('.harvester', article)
  const newButton = mixDataWithButton(info, previousButton)
  previousButton.replaceWith(newButton)
}

/**
 * Create Harvester and append to action-bar.
 *
 * @param {HTMLElement} article `tweet` element
 * @param {string} mode `stream`, `status`, `photo`
 */
const makeHarvester = article => {
  if (isArticleCanBeAppend(article)) {
    const actionBar = select('[role="group"]', article)
    if (actionBar) {
      const harvester = new Harvester(article)

      article.dataset.appended = true
      actionBar.appendChild(harvester.button)
    }
  } else swapButton(article)
}

export default makeHarvester
