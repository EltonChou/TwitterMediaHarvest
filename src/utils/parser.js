import path from 'path'
import select from 'select-dom'
import { isArticlePhotoMode } from './checker'

/**
 * Parse file information from url
 *
 * @param {string} url
 * @returns {object}
 */
export const parseFileFromUrl = url => {
  const src = new URL(url)
  const srcPathname = src.pathname

  if (path.extname(srcPathname) !== '.mp4')
    src.searchParams.append('name', 'orig')
  const srcBasename = path.basename(srcPathname)

  return {
    src: src.href,
    basename: srcBasename,
  }
}

/**
 * @typedef tweetInfo
 * @type {Object}
 * @property {string} screenName
 * @property {string} tweetId
 */
/**
 * Generate tweet information.
 *
 * @param {Element} article A valid tweet element.
 * @returns {tweetInfo}
 */
export const parseTweetInfo = article => {
  const screenNameFeature = /(?<=@)\S+/
  const idFeature = /(?:status\/)(\d+)/
  const urlScreenNameFeature = /(?<=\/)\S+(?=\/status)/

  const time = select('time', article)
  const magicLink = time
    ? time.parentNode.getAttribute('href')
    : window.location.pathname

  let screenName
  if (isArticlePhotoMode(article)) {
    screenName = magicLink.match(urlScreenNameFeature)[0]
  } else {
    const userAccount = select('[data-testid="tweet"] [dir="ltr"]', article)
      .childNodes[0].textContent
    screenName = userAccount.match(screenNameFeature)[0]
  }

  const tweetId = magicLink.match(idFeature)[1]

  return {
    screenName: screenName,
    tweetId: tweetId,
  }
}
