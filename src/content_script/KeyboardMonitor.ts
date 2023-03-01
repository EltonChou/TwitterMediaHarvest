import select from 'select-dom'
import { isTweetDeck } from './utils/checker'


enum Mode {
  Normal,
  TweetDeck
}

enum DownloadKeyCode {
  Twitter = 'KeyD',
  TweetDeck = 'KeyO'
}


export default class KeyboardMonitor {
  readonly mode: Mode
  readonly downloadKey: DownloadKeyCode
  private currentFocusingEle: Element
  private buttonQuery: string

  constructor() {
    const isDeck = isTweetDeck()
    this.mode = isDeck ? Mode.TweetDeck : Mode.Normal
    this.downloadKey = isDeck ? DownloadKeyCode.TweetDeck : DownloadKeyCode.Twitter
    this.buttonQuery = isDeck ? '.deck-harvester' : '.harvester'
    this.currentFocusingEle = document.activeElement
  }

  handleKeyDown(e: KeyboardEvent) {
    if (
      e.code === this.downloadKey
      && e.target instanceof Element
    ) {
      this.currentFocusingEle = this.mode === Mode.TweetDeck ?
        select('.is-selected-tweet') :
        e.target
    }
  }

  handleKeyUp(e: KeyboardEvent) {
    if (
      e.code === this.downloadKey &&
      e.target instanceof Element &&
      this.currentFocusingEle
    ) {
      const tweetCanBeHarvested = this.currentFocusingEle.closest('[data-harvest-article]')
      if (tweetCanBeHarvested) {
        const harvesterButton = select(this.buttonQuery, tweetCanBeHarvested)
        if (harvesterButton) harvesterButton.click()
      }
    }
  }
}

