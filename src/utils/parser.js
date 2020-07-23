import select from 'select-dom'
import { isArticlePhotoMode, isArticleStatusMode } from './checker'

const featureRegEx = Object.freeze({
  id: /(?:status\/)(\d+)/,
  screenName: /(?<=@)\S+/,
  screenNameInURL: /(?<=\/)\S+(?=\/status)/,
})

const parseScreeNameFromUserAccount = article => {
  const userAccount = select('[data-testid="tweet"] [dir="ltr"]', article)
    .childNodes[0].textContent
  const screenName = userAccount.match(featureRegEx.screenName)[0]

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
