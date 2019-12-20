/**
 * Create HTMLElement from html string.
 *
 * @param {InnerHTML} htmlString A valid html.
 * @returns {Element} A valid HTML element
 */
export const createElementFromHTML = htmlString => {
  // eslint-disable-next-line no-undef
  const wrapper = document.createElement('div')
  wrapper.innerHTML = htmlString.trim()
  return wrapper.firstChild
}

/**
 *
 * @param {Object} data
 * @param {Element} button
 *
 * @returns {Element}
 */
export const mixDataWithButton = (data, button) => {
  for (let key in data) {
    button.dataset[key] = data[key]
  }
  return button
}

/**
 *
 * @param {Element} button harvestButton
 *
 * @returns {Element} button
 */
export const mixListenerWithButton = button => {
  button.addEventListener('click', function(e) {
    e.stopImmediatePropagation()
    // eslint-disable-next-line no-undef
    chrome.runtime.sendMessage(this.dataset)
  })
  return button
}
