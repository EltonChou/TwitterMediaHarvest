import select from 'select-dom'
import downloadButtonSVG from '../assets/icons/download-solid.svg'

/**
 * Generate array of images contains `url` and `filename`.
 *
 * @param {HTMLElement} target A valid tweet element.
 * @returns {Array[{url: String, filename: String}]} Array of images-url and filename.
 */
function makeImageJson(target) {
  console.log(target)
  const imageArray = []
  const mediaContainer = select(
    'div.css-1dbjc4n.r-18u37iz.r-thb0q2 > div.css-1dbjc4n.r-1iusvr4.r-46vdb2.r-5f2r5o.r-bcqeeo > div.css-1dbjc4n.r-19i43ro > div.css-1dbjc4n.r-156q2ks',
    target
  )
  debugger
  const medias = select.all('img', mediaContainer)
  for (const media of medias) {
    const imageUrl = new URL(media.src)
    imageUrl.searchParams.set('name', 'orig')
    const fileUrl = imageUrl.href
    const fileName = `${
      imageUrl.pathname.split('/')[2]
    }.${imageUrl.searchParams.get('format')}`
    imageArray.push({ url: fileUrl, filename: fileName })
  }
  return imageArray
}

/**
 * Generate tweet information.
 *
 * @param {HTMLelement} article A valid tweet element.
 * @returns {JSON} tweetInfo
 */
function parseTweetInfo(article) {
  const magicLink = select('time', article).parentNode.getAttribute('href')
  const info = magicLink.split('/')
  return {
    screenName: info[1],
    tweetId: info[3],
  }
}

/**
 * @function createElementFromHTML
 * @param {String} htmlString A valid html.
 * @returns {HTMLElement} A valid HTML element
 */
function createElementFromHTML(htmlString) {
  // eslint-disable-next-line no-undef
  const wrapper = document.createElement('div')
  wrapper.innerHTML = htmlString.trim()
  return wrapper.firstChild
}

export class OrigClick {
  /**
   * @param {Node} article
   */
  constructor(article) {
    this.info = parseTweetInfo(article)
    if (select.exists('img', article)) {
      this.medias = makeImageJson(article)
    }
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
