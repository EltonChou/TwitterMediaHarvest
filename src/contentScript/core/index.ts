/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { getError, isErrorResult } from '#utils/result'
import {
  canArticleBeAppended,
  findButton,
  getLinksFromArticle,
  getTweetIdFromLink,
  isArticlePhotoMode,
  isArticleQuoted,
  parseLinks,
  setTargetArticle,
} from '../utils/article'
import { checkButtonStatus } from '../utils/button'
import { isFunctionablePath } from '../utils/checker'
import { makeHarvestButton } from './Harvester'
import * as O from 'fp-ts/lib/Option'
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

  if (
    isFunctionablePath() &&
    canArticleBeAppended(article) &&
    !isArticleQuoted(article)
  ) {
    const result = pipe(article, setTargetArticle, makeHarvestButton)()
    if (__DEV__ && isErrorResult(result)) {
      // Only the tweet id is parsed so we still get it when screen name parsing fails.
      const tweetLink = pipe(
        article,
        getLinksFromArticle,
        parseLinks(getTweetIdFromLink),
        O.toUndefined
      )
      console.error(getError(result), { tweetLink, article })
    }
  }
}

export default makeHarvester
