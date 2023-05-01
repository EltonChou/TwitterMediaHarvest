import { captureException } from '@sentry/browser'
import { isArticleCanBeAppend, isBetaTweetDeck, isComposingTweet, isTweetDeck, isTwitter } from '../utils/checker'
import DeckHarvester from './DeckHarvester'
import Harvester from './Harvester'

const setTargetArticle = (article: HTMLElement) => {
  if (article) {
    article.dataset.harvestArticle = 'true'
  }
}

const makeHarvester = (article: HTMLElement) => {
  if (isArticleCanBeAppend(article) && !isComposingTweet()) {
    setTargetArticle(article)

    try {
      if (isTwitter()) {
        const harvester = new Harvester(article)
        harvester.appendButton()
      }

      if (isTweetDeck()) {
        const harvester = isBetaTweetDeck() ? new Harvester(article) : new DeckHarvester(article)
        harvester.appendButton()
      }
    } catch (error) {
      captureException(error)
      console.error(error)
    }
  }
}

export default makeHarvester
