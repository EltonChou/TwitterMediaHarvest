import TwitterMediaObserver from './libs/TwitterMediaObserver'
import TwitterDeckObserver from './libs/TwitterDeckObserver'
import { isTweetDeck, isTwitter } from './utils/checker'
import { TwitterMediaHarvestObserver } from './typings'

let observer: TwitterMediaHarvestObserver = undefined

if (isTweetDeck()) {
  observer = new TwitterDeckObserver()
}

if (isTwitter()) {
  observer = new TwitterMediaObserver()
}

observer.observeRoot()
