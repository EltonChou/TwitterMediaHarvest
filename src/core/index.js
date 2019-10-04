import select from 'select-dom'
import '../assets/styles/main.sass'
import downloadButtonSVG from '../assets/icons/twitter-download.svg'
import {
  isArticleCanBeAppend,
  parseTweetInfo,
  createElementFromHTML,
} from '../utils'

/**
 * Generate OrigClick.
 *
 * @param {HTMLNode} addedNode
 * @param {string} mode `stream` or `status` or `photo`
 */
export const makeOrigClick = (article, mode = 'stream') => {
  if (isArticleCanBeAppend(article)) {
    const origButton = OrigClick.makeButton(article, mode)
    article.dataset.appended = true

    const actionBar = select('[role="group"]', article)
    const lastAction = select('div:nth-child(5)', actionBar)

    if (mode === 'status' || mode === 'photo') actionBar.appendChild(origButton)
    if (mode === 'stream') actionBar.insertBefore(origButton, lastAction)
  }
}

const OrigClick = {
  makeButton: (article, mode = 'stream') => {
    const info = parseTweetInfo(article)
    const button = createButtonByMode(mode)

    button.dataset.info = JSON.stringify(info)
    button.addEventListener('click', function() {
      // eslint-disable-next-line no-undef
      chrome.runtime.sendMessage(this.dataset)
    })
    return button
  },
}

const style = {
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
}

function createButtonByMode(mode) {
  const icon = createElementFromHTML(downloadButtonSVG)
  icon.setAttribute(
    'class',
    mode === 'stream' ? style.stream.svg : style.photo.svg
  )
  const buttonWrapper = createElementFromHTML(`
      <div class="css-1dbjc4n origClick ${mode}">
        <div aria-haspopup="true" aria-label="Media Harvest" role="button" data-focusable="true" tabindex="0"
          class="css-18t94o4 css-1dbjc4n r-1777fci r-11cpok1 r-1ny4l3l r-bztko3 r-lrvibr">
          <div dir="ltr"
            class="${mode === 'photo' ? style.photo.ltr : style.stream.ltr}">
            <div class="css-1dbjc4n r-xoduu5">
              <div class="css-1dbjc4n r-sdzlij r-1p0dtai r-xoduu5 r-1d2f490 r-xf4iuw r-u8s1d r-zchlnj r-ipm5af r-o7ynqc r-6416eg origBG"></div>
              ${icon.outerHTML}
            </div>
          </div>
        </div>
      </div>
    `)

  const toggleBG = function() {
    const origBG = select('.origBG', this)
    const ltr = select('[dir="ltr"]', this)
    origBG.classList.toggle(`${mode}BG`)
    ltr.classList.toggle(`${mode}Color`)
  }

  buttonWrapper.addEventListener('mouseover', toggleBG)
  buttonWrapper.addEventListener('mouseout', toggleBG)

  return buttonWrapper
}
