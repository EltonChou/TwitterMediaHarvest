import select from 'select-dom'
import downloadButtonSVG from '../assets/icons/download-solid.svg'
import {
  createElementFromHTML,
  isArticleCanBeAppend,
  parseTweetInfo,
} from '../utils'

/**
 * Generate OrigClick.
 *
 * @param {Node} addedNode
 * @param {string} mode `append` or `insert`
 */
export const makeOrigClick = (article, mode = 'append') => {
  const origClick = new OrigClick(article)
  const origButton = origClick.makeButton()
  if (isArticleCanBeAppend(article)) {
    article.dataset.appended = true

    // const tweet = select('[data-testid="tweet"]', article)
    const actionBar = select('[role="group"]', article)
    const lastAction = select('div:nth-child(5)', actionBar)
    // if (!lastAction || !actionBar) return false
    if (mode === 'append') {
      actionBar.appendChild(origButton)
    }
    if (mode === 'insert') actionBar.insertBefore(origButton, lastAction)
  }
}

export class OrigClick {
  /**
   * @param {Node} article
   */
  constructor(article) {
    this.info = parseTweetInfo(article)
  }

  /**
   * @method makeButton
   * @returns {HTMLElement} OrigClick-Button
   */
  makeButton() {
    const icon = createElementFromHTML(downloadButtonSVG)
    icon.setAttribute(
      'class',
      'r-4qtqp9 r-yyyyoo r-50lct3 r-dnmrzs r-bnwqim r-1plcrui r-lrvibr r-1srniue'
    )
    const buttonWrapper = createElementFromHTML(`
    <div class="css-1dbjc4n r-18u37iz r-1h0z5md r-3qxfft r-h4g966 r-rjfia">
      <div aria-haspopup="true" aria-label="Media Harvest" role="button" data-focusable="true" tabindex="0"
        class="css-18t94o4 css-1dbjc4n r-1777fci r-11cpok1 r-1ny4l3l r-bztko3 r-lrvibr">
        <div dir="ltr"
          class="css-901oao r-1awozwy r-111h2gw r-6koalj r-1qd0xha r-a023e6 r-16dba41 r-1h0z5md r-ad9z0x r-bcqeeo r-o7ynqc r-clp7b1 r-3s2u2q r-qvutc0">
          <div class="css-1dbjc4n r-xoduu5"></div>
          ${icon.outerHTML}
        </div>
      </div>
    </div>
  `)

    buttonWrapper.dataset.info = JSON.stringify(this.info)
    if (this.medias) buttonWrapper.dataset.medias = JSON.stringify(this.medias)
    buttonWrapper.addEventListener('click', function() {
      // eslint-disable-next-line no-undef
      chrome.runtime.sendMessage(this.dataset)
    })
    return buttonWrapper
  }
}
