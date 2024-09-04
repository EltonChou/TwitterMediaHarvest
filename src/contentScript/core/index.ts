import { isArticleCanBeAppend } from '../utils/article'
import { setTargetArticle } from '../utils/article'
import { isFunctionablePath } from '../utils/checker'
import { makeHarvestButton } from './Harvester'
import { pipe } from 'fp-ts/lib/function'

const makeHarvester = (article: HTMLElement) => {
  if (isFunctionablePath() && isArticleCanBeAppend(article)) {
    const makeButton = makeHarvestButton
    const task = pipe(
      article,
      setTargetArticle,
      makeButton
      // IOE.tapError(e => {
      //   /** TODO: Handle error */
      // })
    )

    task()
  }
}

export default makeHarvester
