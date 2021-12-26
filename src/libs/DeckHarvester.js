import {
  createElementFromHTML,
  makeButtonWithData,
  makeButtonListener,
} from '../utils/maker'
import downloadButtonSVG from '../assets/icons/twitter-download.svg'
import select from 'select-dom'

/**
 *
 * @param {HTMLElement} article
 */

const fetchTweetId = article => article.dataset.tweetId

/**
 *
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
  }

  get button() {
    const button = this.createButton()

    makeButtonWithData(button, this.info)
    makeButtonListener(button)

    return button
  }

  createButton() {
    const wrapper = createElementFromHTML(`
      <li class="tweet-action-item pull-left margin-r--10">
        <a class="tweet-action">
          <i class="icon txt-center pull-left">
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
