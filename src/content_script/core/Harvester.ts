import * as Sentry from '@sentry/browser'
import select from 'select-dom'
import downloadButtonSVG from '../../assets/icons/twitter-download.svg'
import {
  checkModeOfArticle,
  isArticleInStatus,
  isArticlePhotoMode,
} from '../utils/checker'
import {
  createElementFromHTML,
  makeButtonListener,
} from '../utils/maker'

const featureRegEx = Object.freeze({
  id: /(?:status\/)(\d+)/,
  screenName: /(?<=@)\S+/,
  screenNameInURL: /(?<=\/)\S+(?=\/status)/,
})

/**
 * @param {HTMLElement} article
 */
const parseScreeNameFromUserAccount = (article: HTMLElement) => {
  const query = 'div[id*="id__"] [role="link"] [dir="ltr"]'
  const userAccountEle = select(query, article)
  if (userAccountEle) {
    const userAccount = userAccountEle.textContent
    return userAccount.match(featureRegEx.screenName)[0]
  }

  throw new Error(`Can't parse screen name. (query: ${query})`)
}

const parseMagicLink = (article: HTMLElement): string => {
  const query = 'a[href*="status"][dir="auto"][role="link"][id^="id__"]'
  if (isArticlePhotoMode(article) || isArticleInStatus(article)) return window.location.pathname
  const linkEle: HTMLAnchorElement = select(query, article)
  if (!linkEle) throw new Error(`Failed to parse magic-link. (query: ${query})`)
  const magicLink = linkEle.href

  return magicLink
}

/**
 * Generate tweet information.
 *
 * @param article A valid tweet element.
 */
// FIXME: some tweet will cause null time error
export const parseTweetInfo = (article: HTMLElement): TweetInfo => {
  Sentry.addBreadcrumb({
    category: 'parse',
    message: 'Parse tweet info.',
    level: 'info',
  })

  try {

    const magicLink = parseMagicLink(article)

    const tweetId = magicLink.match(featureRegEx.id)[1]
    const screenName = isArticlePhotoMode(article)
      ? magicLink.match(featureRegEx.screenNameInURL)[0]
      : parseScreeNameFromUserAccount(article)

    return {
      screenName: screenName,
      tweetId: tweetId,
    }
  } catch (error) {
    Sentry.captureException(error)
  }
}

class Harvester {
  public mode: TweetMode
  public info: TweetInfo
  private ltrStyle: string
  private svgStyle: string

  constructor(article: HTMLElement) {
    this.mode = checkModeOfArticle(article)
    this.info = parseTweetInfo(article)
    if (!this.info.screenName || !this.info.tweetId) {
      throw new Error('Failed to parse tweet info.')
    }

    const sampleButton = select.all('[role="group"] [dir="ltr"]', article).pop()
    this.ltrStyle = sampleButton.classList.value
    this.svgStyle = select('svg', sampleButton).classList.value
  }

  get button() {
    const button = this.createButtonByMode()

    makeButtonListener(button as HTMLElement, parseTweetInfo)

    return button
  }

  /**
   * FIXME: WTF is this shit.
   *
   * FIXME: Need to use different style in `stream`, `status`, `photo`
   */
  createButtonByMode() {
    const mode = this.mode
    const icon = createElementFromHTML(downloadButtonSVG)

    icon.setAttribute('class', this.svgStyle)

    const buttonWrapper = createElementFromHTML(`
      <div class="css-1dbjc4n harvester ${mode}">
        <div aria-haspopup="true" aria-label="Media Harvest" role="button" data-focusable="true" tabindex="0"
          class="css-18t94o4 css-1dbjc4n r-1777fci r-11cpok1 r-1ny4l3l r-bztko3 r-lrvibr">
          <div dir="ltr"
            class="${this.ltrStyle}">
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
    const ltr = select('[dir="ltr"]', buttonWrapper)

    const hoverBG = () => {
      bg.classList.add('hover')
      ltr.classList.add(`${mode}Color`)
      bg.classList.remove('click')
    }

    const hoverOutBG = () => {
      bg.classList.remove('hover')
      ltr.classList.remove(`${mode}Color`)
      bg.classList.remove('click')
    }

    const clickBG = (e: MouseEvent) => {
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

}

export default Harvester
