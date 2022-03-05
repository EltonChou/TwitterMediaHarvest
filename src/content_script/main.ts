import './main.sass'
import TwitterMediaObserver from './observers/TwitterMediaObserver'
import TwitterDeckObserver from './observers/TwitterDeckObserver'
import { isTweetDeck, isTwitter } from './utils/checker'
import { HarvestObserver } from '../typings'

let observer: HarvestObserver = undefined

if (isTweetDeck()) {
  observer = new TwitterDeckObserver()
}

if (isTwitter()) {
  observer = new TwitterMediaObserver()
}

observer.observeRoot()
