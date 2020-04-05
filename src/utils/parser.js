import path from 'path'
import select from 'select-dom'
import { isArticlePhotoMode, isArticleStatusMode } from './checker'

const idFeature = /(?:status\/)(\d+)/
const screenNameFeature = /(?<=@)\S+/
const urlScreenNameFeature = /(?<=\/)\S+(?=\/status)/

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

const parseScreeNameFromUserAccount = article => {
  const userAccount = select('[data-testid="tweet"] [dir="ltr"]', article)
    .childNodes[0].textContent
  const screenName = userAccount.match(screenNameFeature)[0]

  return screenName
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
  const time = select('time', article)
  const magicLink =
    isArticlePhotoMode(article) || isArticleStatusMode(article)
      ? window.location.pathname
      : time.parentNode.getAttribute('href')

  const tweetId = magicLink.match(idFeature)[1]

  const screenName = isArticlePhotoMode(article)
    ? magicLink.match(urlScreenNameFeature)[0]
    : parseScreeNameFromUserAccount(article)

  return {
    screenName: screenName,
    tweetId: tweetId,
  }
}
