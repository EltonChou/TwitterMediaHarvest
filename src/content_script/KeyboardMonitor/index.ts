import select from 'select-dom'
import { DownloadKey } from '../enums'
import { isTwitter } from '../utils/checker'

interface IKeyboardMonitor {
  handleKeyDown(e: KeyboardEvent): void
  handleKeyUp(e: KeyboardEvent): void
}

abstract class GeneralKeyboardMonitor implements IKeyboardMonitor {
  readonly downloadKey: DownloadKey
  private buttonQuery: string
  protected focusing: Element

  constructor(buttonQuery: string, downloadKeyCOde: DownloadKey) {
    this.buttonQuery = buttonQuery
    this.downloadKey = downloadKeyCOde
    this.focusing = document.activeElement
  }

  getButton(target: Element): HTMLElement | null {
    return select(this.buttonQuery, target)
  }

  handleKeyDown(e: KeyboardEvent): void {
    if (!(e.target instanceof Element) || !this.#isValidTarget(e.target as Element)) return
    else if (e.key === this.downloadKey) {
      this.updateFocusing(e)
    }
  }

  handleKeyUp(e: KeyboardEvent): void {
    if (!this.focusing || !(e.target instanceof Element) || !this.#isValidTarget(e.target as Element)) return
    else if (e.key === this.downloadKey) {
      const tweetCanBeHarvested = this.focusing.closest('[data-harvest-article]')
      if (tweetCanBeHarvested) {
        const harvesterButton = this.getButton(tweetCanBeHarvested)
        if (harvesterButton) harvesterButton.click()
      }
    }
  }

  #isValidTarget(target: Element): boolean {
    if (isTwitter() && 'classList' in target) return !target.classList.value.includes('Editor')
    return true
  }

  abstract updateFocusing(e: KeyboardEvent): void
}

export class TweetDeckLegacyKeyboardMonitor extends GeneralKeyboardMonitor {
  constructor() {
    super('.deck-harvester', DownloadKey.LegacyTweetDeck)
  }

  updateFocusing(e: KeyboardEvent): void {
    if (!(e.target instanceof Element)) return
    this.focusing = select('.is-selected-tweet')
  }
}

export class TwitterKeyboardMonitor extends GeneralKeyboardMonitor {
  constructor() {
    super('.harvester', DownloadKey.Twitter)
  }

  updateFocusing(e: KeyboardEvent): void {
    if (!(e.target instanceof Element)) return
    this.focusing = e.target
  }
}

export class TweetDeckBetaKeyboardMonitor extends GeneralKeyboardMonitor {
  constructor() {
    super('.harvester', DownloadKey.BetaTweetDeck)
  }

  updateFocusing(e: KeyboardEvent): void {
    if (!(e.target instanceof Element)) return
    this.focusing = e.target
  }
}
