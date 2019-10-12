import select from 'select-dom'
import '../assets/styles/main.sass'
import downloadButtonSVG from '../assets/icons/twitter-download.svg'
import {
  isArticleCanBeAppend,
  parseTweetInfo,
  createElementFromHTML,
  checkMode,
} from '../utils'

/**
 * Create origClick and append to action-bar.
 *
 * @param {HTMLElement} article `tweet` element
 * @param {string} mode `stream`, `status`, `photo`
 */
export const makeOrigClick = article => {
  const mode = checkMode(article)
  if (isArticleCanBeAppend(article)) {
    const button = OrigClick.createButtonByMode(mode)
    const origButton = OrigClick.integrateArticleWithButton(article, button)
    article.dataset.appended = true

    const actionBar = select('[role="group"]', article)
    if (!actionBar) return false

    // const lastAction = select('div:nth-child(5)', actionBar)
    actionBar.appendChild(origButton)
  }
}

const OrigClick = {
  style: {
    stream: {
      svg:
        'r-4qtqp9 r-yyyyoo r-1xvli5t r-dnmrzs r-bnwqim r-1plcrui r-lrvibr r-1hdv0qi',
      ltr:
        'css-901oao r-1awozwy r-111h2gw r-6koalj r-1qd0xha r-a023e6 r-16dba41 r-1h0z5md r-ad9z0x r-bcqeeo r-o7ynqc r-clp7b1 r-3s2u2q r-qvutc0',
    },
    photo: {
      svg:
        'r-4qtqp9 r-yyyyoo r-50lct3 r-dnmrzs r-bnwqim r-1plcrui r-lrvibr r-1srniue',
      ltr:
        'css-901oao r-1awozwy r-jwli3a r-6koalj r-1qd0xha r-a023e6 r-16dba41 r-1h0z5md r-ad9z0x r-bcqeeo r-o7ynqc r-clp7b1 r-3s2u2q r-qvutc0',
    },
  },
  /**
   * @param {HTMLElement} article `tweet` element
   * @param {string} mode `stream`, `status`, `photo`
   *
   * @returns {HTMLElement}
   */
  integrateArticleWithButton: (article, button) => {
    const info = parseTweetInfo(article)

    for (let key in info) {
      button.dataset[key] = info[key]
    }

    button.addEventListener('click', function() {
      // eslint-disable-next-line no-undef
      chrome.runtime.sendMessage(this.dataset)
    })
    return button
  },
  /**
   *
   * @param {string} mode
   * @returns {HTMLElement} OricClick ButtonWrapper
   */
  createButtonByMode: function(mode) {
    const icon = createElementFromHTML(downloadButtonSVG)
    const iconStyle = (mode === 'stream' ? this.style.stream : this.style.photo)
      .svg
    icon.setAttribute('class', iconStyle)

    const ltrStyle = (mode === 'photo' ? this.style.photo : this.style.stream)
      .ltr

    const buttonWrapper = createElementFromHTML(`
      <div class="css-1dbjc4n origClick ${mode}">
        <div aria-haspopup="true" aria-label="Media Harvest" role="button" data-focusable="true" tabindex="0"
          class="css-18t94o4 css-1dbjc4n r-1777fci r-11cpok1 r-1ny4l3l r-bztko3 r-lrvibr">
          <div dir="ltr"
            class="${ltrStyle}">
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

    const toggleBG = function() {
      bg.classList.toggle('hover')
      ltr.classList.toggle(`${mode}Color`)
      bg.classList.remove('click')
    }

    const clickBG = function(e) {
      bg.classList.toggle('click')
      ltr.classList.toggle('click')
      e.stopImmediatePropagation()
    }

    buttonWrapper.addEventListener('mouseover', toggleBG)
    buttonWrapper.addEventListener('mouseout', toggleBG)
    buttonWrapper.addEventListener('mouseup', clickBG)
    buttonWrapper.addEventListener('mousedown', clickBG)

    return buttonWrapper
  },
}
