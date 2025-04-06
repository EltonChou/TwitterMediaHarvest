/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { getClosedTargetArticle } from '../utils/article'
import { isTwitter } from '../utils/checker'
import type DownloadKey from './DownloadKey'
import type { KeyboardMonitor } from './types'
import { $ } from 'select-dom'

export abstract class GeneralKeyboardMonitor implements KeyboardMonitor {
  readonly downloadKey: DownloadKey
  private buttonQuery: string
  protected focusing: EventTarget | HTMLElement | Element | null

  constructor(buttonQuery: string, downloadKey: DownloadKey) {
    this.buttonQuery = buttonQuery
    this.downloadKey = downloadKey
    this.focusing = document.activeElement
  }

  #getButton(target: HTMLElement): HTMLElement | undefined {
    return $<HTMLElement>(this.buttonQuery, target)
  }

  #isValidTarget(target: unknown): boolean {
    if (target instanceof HTMLElement) {
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')
        return false
      if (isTwitter() && 'classList' in target)
        return !target.classList.value.includes('Editor')
      return true
    }
    return false
  }

  handleKeyDown(e: KeyboardEvent): void {
    if (!this.#isValidTarget(e.target) || e.code !== this.downloadKey) return

    if (e.target) this.updateFocusing(e.target)
  }

  handleKeyUp(e: KeyboardEvent): void {
    if (
      !this.focusing ||
      !this.#isValidTarget(e.target) ||
      e.code !== this.downloadKey
    )
      return

    const tweetCanBeHarvested = getClosedTargetArticle(
      this.focusing as HTMLElement
    )
    if (tweetCanBeHarvested) {
      const harvesterButton = this.#getButton(tweetCanBeHarvested)
      if (harvesterButton) harvesterButton.click()
    }
  }

  abstract updateFocusing(
    focusTarget: EventTarget | HTMLElement | Element
  ): void
}
