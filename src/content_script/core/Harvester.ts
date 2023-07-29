import { addBreadcrumb } from '@sentry/browser'
import select from 'select-dom'
import downloadButtonSVG from '../../assets/icons/twitter-download.svg'
import { checkModeOfArticle, isArticlePhotoMode } from '../utils/checker'
import { createElementFromHTML, makeButtonListener } from '../utils/maker'

const featureRegEx = Object.freeze({
  id: /(?:status\/)(\d+)/,
  screenName: /(\w+)\/(?:status\/)/,
  photoModeUrl: /\w+\/status\/\d+\/(photo|video)\/\d+/,
})

const getLinksFromArticle = (article: HTMLElement): string[] =>
  select.all('[data-testid="User-Name"] [href]', article).map((e: HTMLAnchorElement) => e.href)

const getEleAt = <T>(arr: T[] | undefined | null, index: number): T | undefined =>
  Array.isArray(arr) ? arr.at(index) : undefined

const getTweetIdFromLink = (link: string): string => getEleAt(link.match(featureRegEx.id), 1)
const getScreenNameFromLink = (link: string): string => getEleAt(link.match(featureRegEx.screenName), 1)

/**
 * Generate tweet information.
 *
 * @param article A valid tweet element.
 */
export const parseTweetInfo = (article: HTMLElement): TweetInfo => {
  addBreadcrumb({
    category: 'parse',
    message: 'Parse tweet info.',
    level: 'info',
  })

  const links = isArticlePhotoMode(article) ? [window.location.pathname] : getLinksFromArticle(article)

  const tweetId = links.reduce((tweetId, link) => (tweetId ? tweetId : getTweetIdFromLink(link)), undefined)
  const screenName = links.reduce((name, link) => (name ? name : getScreenNameFromLink(link)), undefined)

  if (![tweetId, screenName].every(v => Boolean(v))) {
    addBreadcrumb({
      category: 'parse',
      message: 'Failed to parse tweet-info.',
      level: 'error',
      data: links,
    })
    throw new Error('Failed to parse tweet-info.')
  }

  return {
    screenName: screenName,
    tweetId: tweetId,
  }
}

const getSampleButton = (article: HTMLElement): HTMLElement | undefined => {
  const shareSvg = select('[role="group"] [dir="ltr"] [data-testid$="iconOutgoing"]', article)
  const sampleButton = shareSvg
    ? (shareSvg.closest('[role="like"] > div') as HTMLElement)
    : select('[data-testid="reply"] > div', article)

  return sampleButton
}

class Harvester implements IHarvester {
  public mode: TweetMode
  private buttonWrapperClassList: string
  private buttonWrapperStyle: string
  private svgStyle: string
  readonly actionBar: HTMLElement
  readonly infoProvider: Provider<TweetInfo>

  constructor(article: HTMLElement) {
    this.mode = checkModeOfArticle(article)
    this.infoProvider = () => parseTweetInfo(article)
    this.actionBar =
      select('[role="group"][aria-label]', article) || select('.r-18u37iz[role="group"][id^="id__"]', article)

    const sampleButton = getSampleButton(article)
    this.buttonWrapperClassList = sampleButton
      ? sampleButton.classList.value
      : 'css-901oao r-1awozwy r-1bwzh9t r-6koalj r-37j5jr r-a023e6 r-16dba41 r-1h0z5md' +
        ' r-rjixqe r-bcqeeo r-o7ynqc r-clp7b1 r-3s2u2q r-qvutc0'
    this.buttonWrapperStyle = sampleButton ? sampleButton.style.cssText : ''

    this.svgStyle =
      select('svg', sampleButton)?.classList.value ||
      'r-4qtqp9 r-yyyyoo r-1xvli5t r-dnmrzs r-bnwqim r-1plcrui r-lrvibr r-1hdv0qi'
  }

  get button() {
    return makeButtonListener(this.createButtonByMode() as HTMLElement, this.infoProvider)
  }

  createButtonByMode() {
    const mode = this.mode
    const icon = createElementFromHTML(downloadButtonSVG)

    icon.setAttribute('class', this.svgStyle)
    // Icon use reply icon as sample, this style can prevent the appearance changed when the reply is restricted.
    icon.setAttribute('style', 'opacity: unset !important;')

    const buttonWrapper = createElementFromHTML(`
      <div class="css-1dbjc4n harvester ${mode}">
        <div aria-haspopup="true" aria-label="Media Harvest" role="button" data-focusable="true" tabindex="0"
          class="css-18t94o4 css-1dbjc4n r-1777fci r-11cpok1 r-1ny4l3l r-bztko3 r-lrvibr">
          <div
            class="${this.buttonWrapperClassList}" style="${this.buttonWrapperStyle}">
            <div class="css-1dbjc4n r-xoduu5">
              <div class="\
              css-1dbjc4n r-sdzlij r-1p0dtai r-xoduu5 r-1d2f490 r-xf4iuw r-u8s1d r-zchlnj r-ipm5af r-o7ynqc r-6416eg\
              ${mode}BG"\
              ></div>
              ${icon.outerHTML}
            </div>
          </div>
        </div>
      </div>
    `)

    const bg = select(`.${mode}BG`, buttonWrapper)
    const ltr = select('[role="button"] > div', buttonWrapper)

    const hoverBG = () => {
      if (!bg || !ltr) return
      bg.classList.add('hover')
      ltr.classList.add(`${mode}Color`)
      bg.classList.remove('click')
    }

    const hoverOutBG = () => {
      if (!bg || !ltr) return
      bg.classList.remove('hover')
      ltr.classList.remove(`${mode}Color`)
      bg.classList.remove('click')
    }

    const clickBG = (e: MouseEvent) => {
      if (!bg || !ltr) return
      bg.classList.toggle('click')
      ltr.classList.toggle('click')
      e.stopImmediatePropagation()
    }

    buttonWrapper.addEventListener('mouseover', hoverBG)
    buttonWrapper.addEventListener('mouseout', hoverOutBG)
    buttonWrapper.addEventListener('mouseup', clickBG)
    buttonWrapper.addEventListener('mousedown', clickBG)

    return buttonWrapper
  }

  appendButton(): void {
    this.actionBar && this.actionBar.appendChild(this.button)
  }
}

export default Harvester
