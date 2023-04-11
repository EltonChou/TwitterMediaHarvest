import select from 'select-dom'
import { isTwitter } from '../utils/checker'

enum DownloadKey {
  Twitter = 'd',
  TweetDeck = 'o',
}

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

export class TweetDeckKeyboardMonitor extends GeneralKeyboardMonitor {
  constructor() {
    super('.deck-harvester', DownloadKey.TweetDeck)
  }

  updateFocusing(e: KeyboardEvent): void {
    if (!(e.target instanceof Element)) return
    this.focusing = select('.is-selected-tweet', e.target)
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
