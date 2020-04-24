import path from 'path'
/**
 * Tweet information
 *
 * @typedef tweetInfo
 * @type {Object}
 * @property {String} screenName
 * @property {String} tweetID
 */
/**
 * @class TwitterMediaFile
 */
export default class TwitterMediaFile {
  /**
   * @constructor
   * @param {tweetInfo} tweetInfo
   * @param {String} url
   * @param {Number} index
   */
  constructor(tweetInfo, url, index = 0) {
    this.screenName = tweetInfo.screenName
    this.tweetID = tweetInfo.tweetID
    this.src = makeOrigSrc(url)
    this.ext = path.extname(url)
    this.name = path.basename(url, this.ext)
    this.order = String(index + 1)
  }

  /**
   *
   * @typedef {import('./chromeApi').fileNameSetting} fileNameSetting
   * @param {fileNameSetting} setting
   */
  makeFileNameBySetting(setting) {
    const root = setting.directory

    const accountPart = setting.filename_pattern.account
      ? `${this.screenName}-`
      : ''

    let serialPart
    switch (setting.filename_pattern.serial) {
      case 'serial':
        serialPart = this.order.padStart(2, '0')
        break

      case 'file_name':
        serialPart = this.name
        break

      default:
        serialPart = this.order.padStart(2, '0')
    }

    const basename = accountPart.concat(this.tweetID, '-', serialPart)
    const fullPath = path.format({
      root: `${root}/`,
      name: basename,
      ext: this.ext,
    })

    return fullPath
  }

  getSrc() {
    return this.src
  }
}

/**
 * Make original quality source of tweet media from media url
 *
 * @param {String} url
 * @returns {String}
 */
function makeOrigSrc(url) {
  if (path.extname(url) === '.mp4') return url

  const baseUrl = new URL(url.slice(0, -4))
  const ext = path.extname(url).split('.')[1]
  baseUrl.searchParams.append('format', ext)
  baseUrl.searchParams.append('name', 'orig')

  return baseUrl.href
}

export { TwitterMediaFile, makeOrigSrc }
