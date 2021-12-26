import select from 'select-dom'
import '../assets/styles/main.sass'
import Harvester from '../libs/Harvester'
import {
  isArticleCanBeAppend,
  isArticleInStatus,
  isTweetDeck,
} from '../utils/checker'

const getActionBarQuery = () => {
  if (isTweetDeck()) return '.actions'

  return isArticleInStatus
    ? '.r-18u37iz[role="group"]'
    : '[role="group"][aria-label]'
}

const articleAppendedConfirm = article =>
  (article.dataset.harvest.appended = true)

/**
 * Create Harvester and append to action-bar.
 * <div role="group" class="css-1dbjc4n r-1oszu61 r-1kfrmmb r-1efd50x r-5kkj8d r-18u37iz r-ahm1il r-a2tzq0">
 * <div aria-label="9 replies, 301 Retweets, 2913 likes" role="group" class="css-1dbjc4n r-18u37iz r-1wtj0ep r-156q2ks r-1mdbhws">
 * <div aria-label="9 replies, 301 Retweets, 2913 likes" role="group" class="css-1dbjc4n r-18u37iz r-ahm1il r-1wtj0ep r-1mnahxq r-10m99ii r-utggzx">
 *
 * @param {HTMLElement} article
 */
const makeHarvester = article => {
  if (isArticleCanBeAppend(article)) {
    const actionBarQuery = getActionBarQuery()

    const actionBar = select(actionBarQuery, article)
    if (actionBar) {
      const harvester = new Harvester(article)

      actionBar.appendChild(harvester.button)
      articleAppendedConfirm(article)
    }
  } else Harvester.swapData(article)
}

export default makeHarvester
