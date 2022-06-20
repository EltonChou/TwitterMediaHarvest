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
  screenName: /.com\/(\S+)\/(?:status\/)/,
})


const parseMagicLink = (article: HTMLElement): string => {
  let query = 'a[href*="status"][dir="auto"][role="link"][id^="id__"]'
  if (isArticlePhotoMode(article) || isArticleInStatus(article)) query = 'a[href*="status"][role="link"]'
  const linkEle: HTMLAnchorElement = select(query, article)

  if (!linkEle) {
    const links: string[] = []
    const anchor_elements = select.all('a[href]', article)
    anchor_elements.forEach(v => links.push(v.href))

    Sentry.addBreadcrumb({
      category: 'parse',
      message: 'Can\'t get magic-link element.',
      level: 'info',
      data: {
        query: query,
        links: links
      }
    })
    throw new Error('Failed to parse magic-link.')
  }

  return linkEle.href
}

/**
 * Generate tweet information.
 *
 * @param article A valid tweet element.
 */
export const parseTweetInfo = (article: HTMLElement): TweetInfo => {
  Sentry.addBreadcrumb({
    category: 'parse',
    message: 'Parse tweet info.',
    level: 'info',
  })

  const magicLink = parseMagicLink(article)

  Sentry.addBreadcrumb({
    category: 'parse',
    message: `Magic link: ${magicLink}`,
    level: 'info',
  })

  if (!magicLink.match(featureRegEx.id).length) {
    throw new Error('Failed to get valid magic link.')
  }

  const tweetId = magicLink.match(featureRegEx.id)[1]
  const screenName = magicLink.match(featureRegEx.screenName)[1]

  return {
    screenName: screenName,
    tweetId: tweetId,
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
