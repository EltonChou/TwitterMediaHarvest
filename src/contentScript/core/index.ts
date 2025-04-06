/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { isArticleCanBeAppend, isArticlePhotoMode } from '../utils/article'
import { findButton, setTargetArticle } from '../utils/article'
import { checkButtonStatus } from '../utils/button'
import { isFunctionablePath } from '../utils/checker'
import { makeHarvestButton } from './Harvester'
import { pipe } from 'fp-ts/lib/function'

const makeHarvester = (article: HTMLElement) => {
  if (isArticlePhotoMode(article) && !isArticleCanBeAppend(article)) {
    const button = findButton(article)
    if (button) checkButtonStatus(button)
  }

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
