import select from 'select-dom'
import '../assets/styles/main.sass'
import Harvester from '../libs/Harvester'
import { isArticleCanBeAppend, isArticleInStatus } from '../utils/checker'
import { makeButtonWithData } from '../utils/maker'
import { parseTweetInfo } from '../utils/parser'

/**
 * @param {HTMLElement} article
 */
const swapData = article => {
  const info = parseTweetInfo(article)
  const havestButton = select('.harvester', article)
  makeButtonWithData(havestButton, info)
}

/**
 * Create Harvester and append to action-bar.
 *
 * @param {HTMLElement} article
 */
const makeHarvester = article => {
  if (isArticleCanBeAppend(article)) {
    const actionBarQuery = isArticleInStatus
      ? '.r-ahm1il[role="group"]'
      : '[role="group"][aria-label]'

    const actionBar = select(actionBarQuery, article)
    if (actionBar) {
      const harvester = new Harvester(article)

      article.dataset.appended = true
      actionBar.appendChild(harvester.button)
    }
  } else swapData(article)
}

export default makeHarvester
