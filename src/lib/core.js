import select from 'select-dom'

/**
 * MutationObserver
 * @param {String} element DOMSelector
 * @callback
 * @param {JSON} options MutationsObserver options
 */
const observeElement = (element, callback, options = { childList: true }) => {
  if (select.exists(element)) {
    // eslint-disable-next-line no-undef
    const observer = new MutationObserver(callback)
    observer.observe(select(element), options)
  }
}

export { observeElement }
