import * as IOE from 'fp-ts/lib/IOEither'
import * as O from 'fp-ts/lib/Option'
import { pipe } from 'fp-ts/lib/function'
import select from 'select-dom'
import downloadButtonSVG from '../../assets/icons/twitter-download.svg'
import { ParserError } from '../exceptions'
import { isArticleInDetail } from '../utils/article'
import { createElementFromHTML, makeButtonListener } from '../utils/maker'

const getTweetIdFromArticle = (article: HTMLElement) =>
  pipe(
    article.tagName === 'ARTICLE' ? article.dataset.tweetId : select('.js-tweet-box').dataset.key,
    O.fromNullable,
    IOE.fromOption(() => new ParserError('Failed to get tweet id.'))
  )

const getScreenNameFromArticle = (article: HTMLElement) =>
  pipe(
    select('username', article),
    O.fromNullable,
    IOE.fromOption(() => 'Failed to get username element'),
    IOE.flatMap(screenNameEle => {
      const match = screenNameEle?.textContent?.match(/^@(.*)/)
      return match ? IOE.left('failed') : IOE.right(match.at(1))
    }),
    IOE.mapError(e => new ParserError(e))
  )

const parseTweetInfo = (article: HTMLElement): IOE.IOEither<ParserError, TweetInfo> =>
  pipe(
    IOE.Do,
    IOE.bind('screenName', () => getScreenNameFromArticle(article)),
    IOE.bind('tweetId', () => getTweetIdFromArticle(article))
  )

class DeckHarvester implements IHarvester {
  public isInDetail: boolean
  readonly actionBar: HTMLElement
  private tweetProvider: IOE.IOEither<Error, TweetInfo>

  constructor(article: HTMLElement) {
    this.isInDetail = isArticleInDetail(article)
    const actionBarQuery = this.isInDetail ? '.tweet-detail-actions' : '.tweet-actions'
    this.actionBar = select(actionBarQuery, article)
    this.tweetProvider = parseTweetInfo(article)
  }

  get button() {
    return makeButtonListener(this.tweetProvider)(this.createButton() as HTMLElement)
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
    if (!this.actionBar) return
    this.actionBar.insertBefore(this.button, this.actionBar.childNodes[7])
    if (this.isInDetail) this.actionBar.classList.add('deck-harvest-actions')
  }
}

export default DeckHarvester
