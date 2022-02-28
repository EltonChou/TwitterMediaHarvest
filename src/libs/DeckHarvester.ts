import select from 'select-dom'
import {
  createElementFromHTML,
  makeButtonWithData,
  makeButtonListener,
} from '../utils/maker'
import downloadButtonSVG from '../assets/icons/twitter-download.svg'
import { isArticleInDetail } from '../utils/checker'
import { TweetInfo } from '../typings'

const fetchTweetId = (article: HTMLElement) =>
  article.dataset.tweetId || select('.js-tweet-box').dataset.key

const parseTweetInfo = (article: HTMLElement): TweetInfo => {
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
  public info: TweetInfo
  public isInDetail: boolean

  constructor(article: HTMLElement) {
    this.info = parseTweetInfo(article)
    this.isInDetail = isArticleInDetail(article)
  }

  get button() {
    const button = this.createButton()

    makeButtonWithData(button as HTMLElement, this.info)
    makeButtonListener(button as HTMLElement)

    return button
  }

  createButton() {
    const liClass = this.isInDetail
      ? 'tweet-detail-action-item  deck-harvester'
      : 'tweet-action-item pull-left margin-r--10 deck-harvester'
    const aClass = this.isInDetail
      ? 'js-show-tip tweet-detail-action position-rel'
      : 'js-show-tip tweet-action position-rel'

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
