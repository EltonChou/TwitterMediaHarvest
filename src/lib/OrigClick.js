import select from 'select-dom'

/**
 * Generate array of images contains `url` and `filename`.
 *
 * @param {HTMLElement} target A valid tweet element.
 * @returns {Array[{url: String, filename: String}]} Array of images-url and filename.
 */
function makeImageJson(target) {
  const imageArray = []
  const medias = select.all('.AdaptiveMedia-photoContainer', target)
  for (const media of medias) {
    const imageUrl = media.dataset.imageUrl.split(':')
    const fileUrl = imageUrl[0] + ':' + imageUrl[1] + ':orig'
    const fileName = imageUrl[1].split('/')[4]
    imageArray.push({ url: fileUrl, filename: fileName })
  }
  return imageArray
}

/**
 * Generate tweet information.
 *
 * @param {HTMLelement} tweet A valid tweet element.
 * @returns {JSON} tweetInfo
 */
function makeTweetInfo(tweet) {
  return {
    userId: tweet.dataset.userId,
    screenName: tweet.dataset.screenName,
    tweetId: tweet.dataset.tweetId,
    conversationId: tweet.dataset.conversationId,
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
   * @param {Node} target
   */
  constructor(target) {
    this.info = makeTweetInfo(target)
    if (select.exists('.AdaptiveMedia-photoContainer', target))
      this.medias = makeImageJson(target)
  }

  /**
   * @method makeButton
   * @returns {HTMLElement} OrigClick-Button
   */
  makeButton() {
    // eslint-disable-next-line no-undef
    const buttonWrapper = createElementFromHTML(`
    <div class="OrigClickWrapper js-tooltip" data-original-title="OrigClick"><div>
  `)
    // eslint-disable-next-line no-undef
    const button = createElementFromHTML(`
    <button class="ProfileTweet-actionButton u-textUserColorHover js-actionButton">
      <div class="IconContainer">
      <span class="Icon Icon--medium OrigClick"></span>
      <span class="u-hiddenVisually">OrigClick</span>
    </div>
  `)

    button.dataset.info = JSON.stringify(this.info)
    if (this.medias) button.dataset.medias = JSON.stringify(this.medias)
    button.addEventListener('click', function() {
      // eslint-disable-next-line no-undef
      chrome.runtime.sendMessage(this.dataset)
    })
    buttonWrapper.append(button)

    return buttonWrapper
  }
}
