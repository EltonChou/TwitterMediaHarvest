import select from 'select-dom'
import downloadButtonSVG from '../assets/icons/twitter-download.svg'
import {
  checkModeOfArticle,
  isArticlePhotoMode,
  isArticleInStatus,
} from '../utils/checker'
import {
  createElementFromHTML,
  makeButtonWithData,
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
const parseScreeNameFromUserAccount = article => {
  const userAccount = select(
    '[role="link"] div[dir="ltr"]',
    article
  ).textContent
  const screenName = userAccount.match(featureRegEx.screenName)[0]

  return screenName
}

/**
 * @typedef {Object} tweetInfo
 * @property {string} screenName
 * @property {string} tweetId
 */
/**
 * Generate tweet information.
 *
 * @param {HTMLElement} article A valid tweet element.
 * @returns {tweetInfo}
 */
// FIXME: some tweet will cause null time error
export const parseTweetInfo = article => {
  let magicLink =
    isArticlePhotoMode(article) || isArticleInStatus(article)
      ? window.location.pathname
      : null

  const time = select('time', article)
  if (!magicLink) {
    magicLink = time.parentNode.getAttribute('href')
  }

  const tweetId = magicLink.match(featureRegEx.id)[1]

  const screenName = isArticlePhotoMode(article)
    ? magicLink.match(featureRegEx.screenNameInURL)[0]
    : parseScreeNameFromUserAccount(article)

  return {
    screenName: screenName,
    tweetId: tweetId,
  }
}

class Harvester {
  constructor(article) {
    this.mode = checkModeOfArticle(article)
    this.info = parseTweetInfo(article)

    const sampleButton = select.all('[role="group"] [dir="ltr"]', article).pop()
    this.ltrStyle = sampleButton.classList.value
    this.svgStyle = select('svg', sampleButton).classList.value
  }

  get button() {
    const button = this.createButtonByMode()

    makeButtonWithData(button, this.info)
    makeButtonListener(button)

    return button
  }

  /**
   * FIXME: WTF is this shit.
   *
   * FIXME: Need to use different style in `stream`, `status`, `photo`
   * @returns {HTMLElement} Harvester
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
              <div class="css-1dbjc4n r-sdzlij r-1p0dtai r-xoduu5 r-1d2f490 r-xf4iuw r-u8s1d r-zchlnj r-ipm5af r-o7ynqc r-6416eg ${mode}BG"></div>
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

    const clickBG = e => {
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

  /**
   * @param {HTMLElement} article
   */
  static swapData(article) {
    const info = parseTweetInfo(article)
    const havestButton = select('.harvester', article)
    makeButtonWithData(havestButton, info)
  }
}

export default Harvester
