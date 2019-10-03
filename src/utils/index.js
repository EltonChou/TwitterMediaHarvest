import select from 'select-dom'
import downloadButtonSVG from '../assets/icons/twitter-download.svg'

const makeSVG = mode => {
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
              <div class="css-1dbjc4n r-sdzlij r-1p0dtai r-xoduu5 r-1d2f490 r-xf4iuw r-u8s1d r-zchlnj r-ipm5af r-o7ynqc r-6416eg"></div>
              ${icon.outerHTML}
            </div>
          </div>
        </div>
      </div>
    `)

  return buttonWrapper
}

/**
 * Check the tweet has been appended or not.
 *
 * @param {HTMLElement} element A valid tweet element
 * @returns {Boolean} Is element has been appended?
 */
const isArticleCanBeAppend = element => {
  return element && !element.dataset.appended
}

/**
 * @function createElementFromHTML
 * @param {String} htmlString A valid html.
 * @returns {HTMLElement} A valid HTML element
 */
const createElementFromHTML = htmlString => {
  // eslint-disable-next-line no-undef
  const wrapper = document.createElement('div')
  wrapper.innerHTML = htmlString.trim()
  return wrapper.firstChild
}

/**
 * Check media is exist in tweet or not.
 *
 * @param {HTMLelement} ele This should be article.
 * @returns {Boolean} Media is exist in tweet or not.
 */
const hasMedia = ele => {
  if (!ele) return false
  if (ele.classList.length === 2) {
    return select.exists('.css-1dbjc4n.r-117bsoe', ele)
  } else {
    const tweet = select('[data-testid="tweet"]', ele)
    const tweetContents = [...tweet.childNodes[1].childNodes]
    return tweetContents.some(
      content =>
        content.classList.length === 2 && content.childNodes.length === 2
    )
  }
}

/**
 * Generate tweet information.
 *
 * @param {HTMLelement} article A valid tweet element.
 * @returns {JSON} tweetInfo
 */
const parseTweetInfo = article => {
  const time = select('time', article)
  const magicLink = time
    ? time.parentNode.getAttribute('href')
    : window.location.pathname
  const info = magicLink.split('/')
  return {
    screenName: info[1],
    tweetId: info[3],
  }
}

/**
 * MutationObserver
 * @param {String} element DOMSelector
 * @callback
 * @param {JSON} options MutationsObserver options
 */
const observeElement = (element, callback, options = { childList: true }) => {
  const observer = new MutationObserver(callback)
  if (element instanceof HTMLElement) {
    observer.observe(element, options)
  }
  if (typeof element === 'string' && select.exists(element)) {
    observer.observe(select(element), options)
  }
  return observer
}

export {
  isArticleCanBeAppend,
  hasMedia,
  createElementFromHTML,
  observeElement,
  parseTweetInfo,
  makeSVG,
}
