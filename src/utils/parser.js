import select from 'select-dom'
import { isArticlePhotoMode, isArticleStatusMode } from './checker'

const idFeature = /(?:status\/)(\d+)/
const screenNameFeature = /(?<=@)\S+/
const urlScreenNameFeature = /(?<=\/)\S+(?=\/status)/

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
// FIXME: some tweet will cause null time error
export const parseTweetInfo = article => {
  let magicLink =
    isArticlePhotoMode(article) || isArticleStatusMode(article)
      ? window.location.pathname
      : null

  const time = select('time', article)
  if (time) {
    magicLink = time.parentNode.getAttribute('href')
  } else return void 0

  const tweetID = magicLink.match(idFeature)[1]

  const screenName = isArticlePhotoMode(article)
    ? magicLink.match(urlScreenNameFeature)[0]
    : parseScreeNameFromUserAccount(article)

  return {
    screenName: screenName,
    tweetID: tweetID,
  }
}
