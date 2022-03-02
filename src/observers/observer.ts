import select from 'select-dom'

/**
 * MutationObserver
 * @param element valid DOMSelector string or HTMLElement
 * @param observerCallback MutationsObserver callback
 * @param options MutationsObserver options
 */
export const observeElement = (
  element: HTMLElement | string,
  observerCallback: MutationCallback,
  options: MutationObserverInit = { childList: true }
): MutationObserver => {
  const observer = new MutationObserver(observerCallback)
  if (element instanceof HTMLElement) {
    observer.observe(element, options)
  }
  if (typeof element === 'string' && select.exists(element)) {
    observer.observe(select(element), options)
  }
  return observer
}

export default observeElement
