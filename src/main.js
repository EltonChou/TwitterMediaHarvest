import TwitterMediaObserver from './libs/TwitterMediaObserver'
import TwitterDeckObserver from './libs/TwitterDeckObserver'
import { isTweetDeck, isTwitter } from './utils/checker'

let observer = undefined

if (isTweetDeck()) {
  observer = new TwitterDeckObserver()
}

if (isTwitter()) {
  observer = new TwitterMediaObserver()
}

observer.observeRoot()
