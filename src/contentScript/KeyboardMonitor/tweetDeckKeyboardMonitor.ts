/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import DownloadKey from './DownloadKey'
import { GeneralKeyboardMonitor } from './generalKeyboardMonitor'

export class TweetDeckBetaKeyboardMonitor extends GeneralKeyboardMonitor {
  constructor() {
    super('.harvester', DownloadKey.BetaTweetDeck)
  }

  updateFocusing(focusTarget: EventTarget | HTMLElement | Element): void {
    this.focusing = focusTarget
  }
}
