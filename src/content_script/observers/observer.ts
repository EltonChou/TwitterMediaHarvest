import select from 'select-dom'

const isElementObserved = (ele: HTMLElement) => Boolean(ele.dataset.harvestObserveTag)

/**
 * MutationObserver
 * @param dataTag Tag to set in target's dataset
 * @param element valid DOMSelector string or HTMLElement
 * @param observerCallback MutationsObserver callback
 * @param options MutationsObserver options
 */
export const observeElement = (
  dataTag: string,
  element: HTMLElement | string,
  observerCallback: MutationCallback,
  options: MutationObserverInit = { childList: true }
): MutationObserver => {
  const observer = new MutationObserver(observerCallback)
  const observeElement = element instanceof HTMLElement ? element : select(element)

  if (observeElement && !isElementObserved(observeElement)) {
    observer.observe(observeElement, options)
    observeElement.dataset.harvestObserveTag = dataTag
  }

  return observer
}

export default observeElement
