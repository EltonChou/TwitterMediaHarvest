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
