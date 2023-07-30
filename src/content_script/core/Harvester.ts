import { addBreadcrumb, captureMessage } from '@sentry/browser'
import select from 'select-dom'
import downloadButtonSVG from '../../assets/icons/twitter-download.svg'
import { checkModeOfArticle, isArticlePhotoMode, isDefined } from '../utils/checker'
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

  const links = [window.location.pathname]
  if (!isArticlePhotoMode(article)) links.push(...getLinksFromArticle(article))

  const tweetId = links.reduce((tweetId, link) => (tweetId ? tweetId : getTweetIdFromLink(link)), undefined)
  const screenName = links.reduce((name, link) => (name ? name : getScreenNameFromLink(link)), undefined)

  if (!isDefined(tweetId, screenName)) {
    addBreadcrumb({
      category: 'parse',
      message: 'Failed to parse tweet-info.',
      level: 'error',
      data: links,
    })
    captureMessage('Parse info error')
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

const removeButtonStatsText = (wrapper: HTMLElement) =>
  select('[data-testid="app-text-transition-container"] > span > span', wrapper)?.remove()

const makeButtonWrapper = (sampleButton?: HTMLElement) => (mode: TweetMode) => {
  const wrapper = sampleButton.cloneNode(true) as HTMLElement

  const svg = select('svg', wrapper)
  svg?.previousElementSibling.classList.add(`${mode}BG`)
  svg?.replaceWith(
    makeButtonIcon(svg?.classList.value || 'r-4qtqp9 r-yyyyoo r-1xvli5t r-dnmrzs r-bnwqim r-1plcrui r-lrvibr r-1hdv0qi')
  )
  removeButtonStatsText(wrapper)
  return wrapper
}

class Harvester implements IHarvester {
  public mode: TweetMode
  private buttonWrapper: HTMLElement
  readonly actionBar: HTMLElement
  readonly infoProvider: Provider<TweetInfo>

  constructor(article: HTMLElement) {
    this.mode = checkModeOfArticle(article)
    this.infoProvider = () => parseTweetInfo(article)
    this.actionBar =
      select('[role="group"][aria-label]', article) || select('.r-18u37iz[role="group"][id^="id__"]', article)

    const sampleButton = getSampleButton(article)
    this.buttonWrapper = makeButtonWrapper(sampleButton)(this.mode)
  }

  get button() {
    return makeButtonListener(this.createButtonByMode() as HTMLElement, this.infoProvider)
  }

  createButtonByMode() {
    const buttonWrapper = createElementFromHTML(`
      <div class="css-1dbjc4n harvester ${this.mode}">
        <div aria-haspopup="true" aria-label="Media Harvest" role="button" data-focusable="true" tabindex="0" \
        style="
          display: flex;
          justify-content: center;
        ">
          ${this.buttonWrapper.outerHTML}
        </div>
      </div>
    `)

    const bg = select(`.${this.mode}BG`, buttonWrapper)
    const ltr = select('[role="button"] > div', buttonWrapper)

    const hoverBG = () => {
      if (!bg || !ltr) return
      bg.classList.add('hover')
      ltr.classList.add(`${this.mode}Color`)
      bg.classList.remove('click')
    }

    const hoverOutBG = () => {
      if (!bg || !ltr) return
      bg.classList.remove('hover')
      ltr.classList.remove(`${this.mode}Color`)
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

const makeButtonIcon = (svgStyle: string) => {
  const icon = createElementFromHTML(downloadButtonSVG)
  icon.setAttribute('class', svgStyle)
  // this style can prevent the appearance changed when the reply is restricted.
  icon.setAttribute('style', 'opacity: unset !important;')
  return icon
}

export default Harvester
