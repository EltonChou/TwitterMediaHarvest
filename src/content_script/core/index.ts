import { isArticleCanBeAppend } from '../utils/article'
import { isFunctionablePath, isTweetDeck } from '../utils/checker'
import { captureExceptionIO } from '../utils/helper'
import DeckHarvest from './DeckHarvester'
import { makeHarvestButton } from './Harvester'
import { toError } from 'fp-ts/lib/Either'
import * as IOE from 'fp-ts/lib/IOEither'
import { pipe } from 'fp-ts/lib/function'

const makeDeckButton = (article: HTMLElement) =>
  pipe(
    IOE.tryCatch(() => new DeckHarvest(article).appendButton(), toError),
    IOE.map(() => 'sucess')
  )

const setTargetArticle = (article: HTMLElement) => {
  if (article) {
    article.dataset.harvestArticle = 'true'
  }
  return article
}

const makeHarvester = (article: HTMLElement) => {
  if (isFunctionablePath() && isArticleCanBeAppend(article)) {
    const makeButton = isTweetDeck() ? makeDeckButton : makeHarvestButton
    pipe(
      article,
      setTargetArticle,
      makeButton,
      IOE.mapLeft(e => (e instanceof Error ? e : toError(e))),
      IOE.tapError(e => pipe(e, captureExceptionIO, IOE.fromIO))
    )()
  }
}

export default makeHarvester
