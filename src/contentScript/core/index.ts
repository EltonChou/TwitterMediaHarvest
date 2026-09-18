/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { getError, isErrorResult } from '#utils/result'
import {
  canArticleBeAppended,
  findButton,
  isArticlePhotoMode,
  setTargetArticle,
} from '../utils/article'
import { checkButtonStatus } from '../utils/button'
import { isFunctionablePath } from '../utils/checker'
import { makeHarvestButton } from './Harvester'
import { pipe } from 'fp-ts/lib/function'

const makeHarvester = (article: HTMLElement) => {
  /**
   * The button in photo mode will not be changed with post changing, so the
   * status need to be checked manually
   */
  if (isArticlePhotoMode(article) && !canArticleBeAppended(article)) {
    const button = findButton(article)
    if (button) checkButtonStatus(button)
  }

  if (isFunctionablePath() && canArticleBeAppended(article)) {
    const result = pipe(article, setTargetArticle, makeHarvestButton)()
    if (__DEV__ && isErrorResult(result)) console.error(getError(result))
  }
}

export default makeHarvester
