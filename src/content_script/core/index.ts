import { captureException } from '@sentry/browser'
import { isArticleCanBeAppend, isFunctionablePath } from '../utils/checker'
import Harvester from './Harvester'

const setTargetArticle = (article: HTMLElement) => {
  if (article) {
    article.dataset.harvestArticle = 'true'
  }
}

const makeHarvester = (article: HTMLElement) => {
  if (isFunctionablePath() && isArticleCanBeAppend(article)) {
    setTargetArticle(article)

    try {
      const harvester = new Harvester(article)
      harvester.appendButton()
    } catch (error) {
      captureException(error)
      console.error(error)
    }
  }
}

export default makeHarvester
