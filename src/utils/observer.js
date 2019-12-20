import select from 'select-dom'

/**
 * MutationObserver
 * @param {String} element DOMSelector
 * @param {MutationCallback} callback
 * @param {Object} options MutationsObserver options
 * @returns {MutationObserver}
 */
export const observeElement = (
  element,
  callback,
  options = { childList: true }
) => {
  const observer = new MutationObserver(callback)
  if (element instanceof HTMLElement) {
    observer.observe(element, options)
  }
  if (typeof element === 'string' && select.exists(element)) {
    observer.observe(select(element), options)
  }
  return observer
}

export default observeElement
