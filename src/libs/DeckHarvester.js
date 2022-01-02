import select from 'select-dom'
import {
  createElementFromHTML,
  makeButtonWithData,
  makeButtonListener,
} from '../utils/maker'
import downloadButtonSVG from '../assets/icons/twitter-download.svg'
import { isArticleInDetail } from '../utils/checker'

/**
 * @param {HTMLElement} article
 */
const fetchTweetId = article =>
  article.dataset.tweetId || select('.js-tweet-box').dataset.key

/**
 * @param {HTMLElement} article
 */
const parseTweetInfo = article => {
  const screenNamePattern = /^@(.*)/
  const screenNameEle = select('.username', article)
  const screenName = screenNameEle.textContent.match(screenNamePattern)[1]
  const tweetId = fetchTweetId(article)

  return {
    screenName: screenName,
    tweetId: tweetId,
  }
}

class DeckHarvester {
  constructor(article) {
    this.info = parseTweetInfo(article)
    this.isInDetail = isArticleInDetail(article)
  }

  get button() {
    const button = this.createButton()

    makeButtonWithData(button, this.info)
    makeButtonListener(button)

    return button
  }

  createButton() {
    const liClass = this.isInDetail
      ? 'tweet-detail-action-item'
      : 'tweet-action-item pull-left margin-r--10'
    const aClass = this.isInDetail
      ? 'js-show-tip tweet-detail-action position-rel deck-harvester'
      : 'js-show-tip tweet-action position-rel deck-harvester'

    const wrapper = createElementFromHTML(`
      <li class="${liClass}">
        <a class="${aClass}" data-original-title="Download via MediaHarvest">
          <i class="icon txt-center ${this.isInDetail ? '' : 'pull-left'}">
            ${downloadButtonSVG}
          </i>
        </a>
        <span class="is-vishidden">Download</span>
      </li>
    `)

    return wrapper
  }
}

export default DeckHarvester
