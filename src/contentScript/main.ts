 
import { FeatureSettingsRepository } from '#infra/repositories/featureSettings'
import { LocalExtensionStorageProxy } from '#infra/storageProxy'
import { TweetDeckBetaKeyboardMonitor, TwitterKeyboardMonitor } from './KeyboardMonitor'
import './main.sass'
import TweetDeckBetaObserver from './observers/TweetDeckBetaObserver'
import TwitterMediaObserver from './observers/TwitterMediaObserver'
import { isBetaTweetDeck, isTwitter } from './utils/checker'

export const featureSettingsRepo = new FeatureSettingsRepository(
  new LocalExtensionStorageProxy()
)

const useObserver = (revealNsfw: boolean) => {
  if (isTwitter()) return new TwitterMediaObserver(revealNsfw)
  if (isBetaTweetDeck()) return new TweetDeckBetaObserver(revealNsfw)
  return new TwitterMediaObserver(revealNsfw)
}

const useKeboardMonitor = () => {
  if (isTwitter()) return new TwitterKeyboardMonitor()
  if (isBetaTweetDeck()) return new TweetDeckBetaKeyboardMonitor()
  return new TwitterKeyboardMonitor()
}

const monitorKeyboardByFlag = (() => {
  let hasMonitored = false
  return (flag: boolean) => {
    if (!flag || hasMonitored) return
    const kbMonitor = useKeboardMonitor()
    if (!kbMonitor) return
    hasMonitored = true
    window.addEventListener('keyup', e => kbMonitor.handleKeyUp(e))
    window.addEventListener('keydown', e => kbMonitor.handleKeyDown(e))
  }
})()

featureSettingsRepo
  .get()
  .then(feature => {
    monitorKeyboardByFlag(feature.keyboardShortcut)
    return feature
  })
  .then(feature => {
    const observer = useObserver(feature.autoRevealNsfw)
    if (!observer) return

    window.addEventListener(
      'focus',
      (() => {
        let hasFocused = false
        return () => {
          monitorKeyboardByFlag(feature.keyboardShortcut)
          observer.initialize()
          if (!hasFocused) {
            observer.observeRoot()
            hasFocused = true
          }
        }
      })()
    )

    observer.observeRoot()
    return feature
  })
