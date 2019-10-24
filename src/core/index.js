import select from 'select-dom'
import '../assets/styles/main.sass'
import {
  isArticleCanBeAppend,
  parseTweetInfo,
  checkMode,
  integrateDataWithButton,
  integrateArticleWithButton,
} from '../utils'
import Harvester from '../lib/Harvester'

/**
 * Create Harvester and append to action-bar.
 *
 * @param {HTMLElement} article `tweet` element
 * @param {string} mode `stream`, `status`, `photo`
 */
export const makeHarvester = article => {
  const mode = checkMode(article)
  if (isArticleCanBeAppend(article)) {
    const button = Harvester.createButtonByMode(mode)
    const harvestButton = integrateArticleWithButton(article, button)
    article.dataset.appended = true

    const actionBar = select('[role="group"]', article)
    if (!actionBar) return false

    actionBar.appendChild(harvestButton)
  } else {
    const info = parseTweetInfo(article)
    const previousButton = select('.harvester', article)
    const newButton = integrateDataWithButton(info, previousButton)
    previousButton.replaceWith(newButton)
  }
}
