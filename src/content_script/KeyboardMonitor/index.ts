import select from 'select-dom'

enum DownloadKeyCode {
  Twitter = 'KeyD',
  TweetDeck = 'KeyO',
}

interface IKeyboardMonitor {
  handleKeyDown(e: KeyboardEvent): void
  handleKeyUp(e: KeyboardEvent): void
}

abstract class GeneralKeyboardMonitor implements IKeyboardMonitor {
  readonly downloadKeyCode: DownloadKeyCode
  private buttonQuery: string
  private _focusing: Element

  constructor(buttonQuery: string, downloadKeyCOde: DownloadKeyCode) {
    this.buttonQuery = buttonQuery
    this.downloadKeyCode = downloadKeyCOde
    this._focusing = document.activeElement
  }

  get focusing() {
    return this._focusing
  }

  set focusing(target: Element) {
    this._focusing = target
  }

  getButton(target: Element): HTMLElement | null {
    return select(this.buttonQuery, target)
  }

  handleKeyDown(e: KeyboardEvent): void {
    if (e.code === this.downloadKeyCode) {
      this.updateFocusing(e)
    }
  }

  handleKeyUp(e: KeyboardEvent): void {
    if (!this.focusing || !(e.target instanceof Element)) return

    if (e.code === this.downloadKeyCode) {
      const tweetCanBeHarvested = this.focusing.closest('[data-harvest-article]')
      if (tweetCanBeHarvested) {
        const harvesterButton = this.getButton(tweetCanBeHarvested)
        if (harvesterButton) harvesterButton.click()
      }
    }
  }

  abstract updateFocusing(e: KeyboardEvent): void
}

export class TweetDeckKeyboardMonitor extends GeneralKeyboardMonitor {
  constructor() {
    super('.deck-harvester', DownloadKeyCode.TweetDeck)
  }

  updateFocusing(e: KeyboardEvent): void {
    if (!(e.target instanceof Element)) return
    this.focusing = select('.is-selected-tweet', e.target)
  }
}

export class TwitterKeyboardMonitor extends GeneralKeyboardMonitor {
  constructor() {
    super('.harvester', DownloadKeyCode.Twitter)
  }

  updateFocusing(e: KeyboardEvent): void {
    if (!(e.target instanceof Element)) return
    this.focusing = e.target
  }
}
