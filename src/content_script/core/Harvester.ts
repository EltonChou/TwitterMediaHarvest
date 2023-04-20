import { addBreadcrumb } from '@sentry/browser'
import select from 'select-dom'
import downloadButtonSVG from '../../assets/icons/twitter-download.svg'
import { checkModeOfArticle, isArticleInStatus, isArticlePhotoMode } from '../utils/checker'
import { createElementFromHTML, makeButtonListener } from '../utils/maker'

const featureRegEx = Object.freeze({
  id: /(?:status\/)(\d+)/,
  screenName: /(\w+)\/(?:status\/)/,
  photoModeUrl: /\w+\/status\/\d+\/(photo|video)\/\d+/,
})

type MagicLinkElement = {
  element: HTMLAnchorElement | null
  query: string
}

const getMagicLinkEle = (article: HTMLElement): MagicLinkElement => {
  let magicLink: MagicLinkElement = {
    element: null,
    query: undefined,
  }

  if (isArticlePhotoMode(article) || isArticleInStatus(article)) {
    const tweetId = window.location.pathname.match(featureRegEx.id)[1]
    const query = `a[href*="${tweetId}"][role="link"]`
    magicLink.element = select(query, article) || null
    magicLink.query = query
    return magicLink
  }

  const querys: string[] = [
    '[data-testid="User-Names"] a[href*="status"][dir="auto"][role="link"]',
    'a[href*="status"][dir="auto"][role="link"]',
  ]

  magicLink = querys.reduce((magicLink, currQuery) => {
    magicLink.query = currQuery
    const linkEle: HTMLAnchorElement = select(currQuery, article)
    if (linkEle) {
      magicLink.element = linkEle
    }
    return magicLink
  }, magicLink)

  return magicLink
}

const parseMagicLink = (article: HTMLElement): string => {
  const magicLink: MagicLinkElement = getMagicLinkEle(article)

  if (!magicLink.element) {
    const links: string[] = select.all('a[href]', article).map(v => {
      if (v.href.match(featureRegEx.id) && !magicLink.element) magicLink.element = v
      return v.href
    })

    addBreadcrumb({
      category: 'parse',
      message: 'Cannott get magic-link element.',
      level: 'info',
      data: {
        query: magicLink.query,
        links: links,
      },
    })

    if (!magicLink.element) {
      if (window.location.pathname.match(featureRegEx.photoModeUrl) && isArticlePhotoMode(article))
        return window.location.href
      throw new Error('Failed to parse magic-link.')
    }
  }

  return magicLink.element.href
}

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

  const magicLink: string = parseMagicLink(article)

  addBreadcrumb({
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

const getSampleButton = (article: HTMLElement): HTMLElement => {
  const shareSvg = select('[role="group"] [dir="ltr"] [data-testid$="iconOutgoing"]', article)
  const sampleButton = shareSvg
    ? (shareSvg.closest('[role="like"] > div') as HTMLElement)
    : select('[data-testid="reply"] > div', article)

  if (!sampleButton) throw new Error('Cannot get sample button.')
  return sampleButton
}

class Harvester {
  public mode: TweetMode
  private ltrStyle: string
  private svgStyle: string

  constructor(article: HTMLElement) {
    this.mode = checkModeOfArticle(article)

    const sampleButton = getSampleButton(article)
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
    // Icon use reply icon as sample, this style can prevent the appearance changed when the reply is restricted.
    icon.setAttribute('style', 'opacity: unset !important;')

    const buttonWrapper = createElementFromHTML(`
      <div class="css-1dbjc4n harvester ${mode}">
        <div aria-haspopup="true" aria-label="Media Harvest" role="button" data-focusable="true" tabindex="0"
          class="css-18t94o4 css-1dbjc4n r-1777fci r-11cpok1 r-1ny4l3l r-bztko3 r-lrvibr">
          <div
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
}

export default Harvester
