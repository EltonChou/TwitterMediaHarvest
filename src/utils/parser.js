import path from 'path'
import select from 'select-dom'

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
  const time = select('time', article)
  const magicLink = time
    ? time.parentNode.getAttribute('href')
    : select('link[rel="canonical"]').href

  const info = magicLink.split('/')
  return {
    screenName: info[1],
    tweetId: info[3],
  }
}
