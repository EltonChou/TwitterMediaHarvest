import select from 'select-dom'
import downloadButtonSVG from '../../assets/icons/twitter-download.svg'
import { isArticleInDetail } from '../utils/checker'
import { createElementFromHTML, makeButtonListener } from '../utils/maker'

const fetchTweetId = (article: HTMLElement) =>
  article.tagName === 'ARTICLE' ? article.dataset.tweetId : select('.js-tweet-box').dataset.key

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

class DeckHarvester implements IHarvester {
  public isInDetail: boolean
  readonly actionBar: HTMLElement

  constructor(article: HTMLElement) {
    this.isInDetail = isArticleInDetail(article)
    const actionBarQuery = this.isInDetail ? '.tweet-detail-actions' : '.tweet-actions'
    this.actionBar = select(actionBarQuery, article)
  }

  get button() {
    const button = this.createButton()
    makeButtonListener(button as HTMLElement, parseTweetInfo)

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

  appendButton(): void {
    this.actionBar.insertBefore(this.button, this.actionBar.childNodes[7])
    if (this.isInDetail) this.actionBar.classList.add('deck-harvest-actions')
  }
}

export default DeckHarvester
