/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { getClosedTargetArticle } from '../utils/article'
import { getNearestCenterElement } from '../utils/helper'
import DownloadKey from './DownloadKey'
import { GeneralKeyboardMonitor } from './generalKeyboardMonitor'

export class TwitterKeyboardMonitor extends GeneralKeyboardMonitor {
  constructor() {
    super('.harvester', DownloadKey.Twitter)
  }

  /**
   * 1. Get closest article by current target.
   * 2. Get article by activeElement, this element is set by X's keyboard
   * shortcut.
   * 3. Use visual window to guess current focusing target.
   */
  focus(focusTarget: Element): void {
    let article = getClosedTargetArticle(focusTarget)
    if (article) {
      super.focus(article)
      return
    }

    if (document.activeElement) {
      article = getClosedTargetArticle(document.activeElement)
      if (article) {
        super.focus(article)
        return
      }
    }

    const ele = getNearestCenterElement('article')
    if (ele) super.focus(ele)
  }
}
