import DownloadKey from './DownloadKey'
import { GeneralKeyboardMonitor } from './generalKeyboardMonitor'

export class TwitterKeyboardMonitor extends GeneralKeyboardMonitor {
  constructor() {
    super('.harvester', DownloadKey.Twitter)
  }

  updateFocusing(focusTarget: EventTarget | HTMLElement | Element): void {
    this.focusing = focusTarget
  }
}
