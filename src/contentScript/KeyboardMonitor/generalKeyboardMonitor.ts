/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { isTwitter } from '../utils/checker'
import type DownloadKey from './DownloadKey'
import type { KeyboardMonitor } from './types'
import { $ } from 'select-dom'

export abstract class GeneralKeyboardMonitor implements KeyboardMonitor {
  readonly downloadKey: DownloadKey
  private buttonQuery: string
  /**
   * This element should always be a valid article element
   */
  protected focusing: HTMLElement | null

  constructor(buttonQuery: string, downloadKey: DownloadKey) {
    this.buttonQuery = buttonQuery
    this.downloadKey = downloadKey
    this.focusing = null
  }

  #getButton(): HTMLElement | undefined {
    if (!this.focusing) return undefined
    return $<HTMLElement>(this.buttonQuery, this.focusing)
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

    if (e.target && e.target instanceof Element) this.focus(e.target)
  }

  handleKeyUp(e: KeyboardEvent): void {
    if (
      !this.focusing ||
      !this.#isValidTarget(e.target) ||
      e.code !== this.downloadKey
    )
      return

    if (this.focusing) {
      const harvesterButton = this.#getButton()
      if (harvesterButton) harvesterButton.click()
    }
  }

  focus(target: HTMLElement | Element): void {
    if (target instanceof HTMLElement) this.focusing = target
  }
}
