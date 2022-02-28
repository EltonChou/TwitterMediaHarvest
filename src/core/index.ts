import select from 'select-dom'
import '../assets/styles/main.sass'
import Harvester from '../libs/Harvester'
import DeckHarvester from '../libs/DeckHarvester'
import {
  isArticleCanBeAppend,
  isArticleInStatus,
  isArticleInDetail,
  isTweetDeck,
  isTwitter,
} from '../utils/checker'

const getActionBarQuery = (article: HTMLElement) => {
  if (isTweetDeck()) {
    return isArticleInDetail(article)
      ? '.tweet-detail-actions'
      : '.tweet-actions'
  }

  return isArticleInStatus(article)
    ? '.r-18u37iz[role="group"]'
    : '[role="group"][aria-label]'
}

const articleAppendedConfirm = (article: HTMLElement): void => {
  article.dataset.harvestAppended = 'true'
}

const twitterActionAppend = (actionBar: HTMLElement, button: HTMLElement | Element) =>
  actionBar.appendChild(button)

const deckActionInsert = (actionBar: HTMLElement, button: HTMLElement | Element) => {
  actionBar.insertBefore(button, actionBar.childNodes[7])
  return actionBar
}

/**
 * Create Harvester and append to action-bar.
 * <div role="group" class="css-1dbjc4n r-1oszu61 r-1kfrmmb r-1efd50x r-5kkj8d r-18u37iz r-ahm1il r-a2tzq0">
 * <div aria-label="9 replies, 301 Retweets, 2913 likes" role="group" class="css-1dbjc4n r-18u37iz r-1wtj0ep r-156q2ks r-1mdbhws">
 * <div aria-label="9 replies, 301 Retweets, 2913 likes" role="group" class="css-1dbjc4n r-18u37iz r-ahm1il r-1wtj0ep r-1mnahxq r-10m99ii r-utggzx">
 */
const makeHarvester = (article: HTMLElement) => {
  if (isArticleCanBeAppend(article)) {
    const actionBarQuery = getActionBarQuery(article)

    const actionBar = select(actionBarQuery, article)
    if (actionBar) {
      let harvester = undefined

      if (isTwitter()) {
        harvester = new Harvester(article)
        twitterActionAppend(actionBar, harvester.button)
      }

      if (isTweetDeck()) {
        harvester = new DeckHarvester(article)
        deckActionInsert(actionBar, harvester.button)
        if (isArticleInDetail(article)) {
          actionBar.classList.add('deck-harvest-actions')
        }
      }

      articleAppendedConfirm(article)
    }
  } else {
    if (isTwitter()) Harvester.swapData(article)
  }
}

export default makeHarvester
