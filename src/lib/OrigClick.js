import select from 'select-dom'

function makeImageJson(target) {
  const preJSON = []
  const medias = select.all('.AdaptiveMedia-photoContainer', target)
  for (const media of medias) {
    preJSON.push(createImageUrlObject(media.dataset.imageUrl))
  }
  return preJSON
}

function makeTweetInfo(element) {
  const info = select('.tweet', element)
  return {
    userId: info.dataset.userId,
    screenName: info.dataset.screenName,
    tweetId: info.dataset.tweetId,
    conversationId: info.dataset.conversationId,
  }
}

function createImageUrlObject(url) {
  const imageUrl = url.split(':')
  const dataUrl = imageUrl[0] + ':' + imageUrl[1] + ':orig'
  const dataName = imageUrl[1].split('/')[4]
  return { url: dataUrl, name: dataName }
}

export function OrigClick(target) {
  this.info = makeTweetInfo(target)
  if (select.exists('.AdaptiveMedia-photoContainer', target))
    this.medias = makeImageJson(target)
}

OrigClick.prototype.makebutton = function() {
  // eslint-disable-next-line no-undef
  const buttonWrapper = document.createElement('div')
  buttonWrapper.setAttribute('class', 'OrigClickWrapper js-tooltip')
  buttonWrapper.dataset['originalTitle'] = 'OrigClick'
  // eslint-disable-next-line no-undef
  const button = document.createElement('button')
  button.setAttribute(
    'class',
    'ProfileTweet-actionButton u-textUserColorHover js-actionButton'
  )
  button.innerHTML = `
    <div id="OricgClick" class="IconContainer">
    <span class="Icon Icon--medium OrigClick" id="lazyIcon"></span>
    <span class="u-hiddenVisually">OrigClick</span>
    </div>
  `
  button.dataset.info = JSON.stringify(this.info)
  if (this.medias) button.dataset.medias = JSON.stringify(this.medias)
  button.addEventListener('click', function() {
    // eslint-disable-next-line no-undef
    chrome.runtime.sendMessage(this.dataset)
  })
  buttonWrapper.append(button)
  return buttonWrapper
}
