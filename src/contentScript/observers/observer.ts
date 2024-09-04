import select from 'select-dom'

const OBSERVE_ID_CRITERIA = 'harvestObserveId'

export const isElementObserved = <T extends HTMLElement = HTMLElement>(ele: T) =>
  Boolean(ele.dataset[OBSERVE_ID_CRITERIA])

export const setObserverId =
  (id: string) =>
  <T extends HTMLElement = HTMLElement>(ele: T): T => {
    ele.dataset[OBSERVE_ID_CRITERIA] = id
    return ele
  }

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
): MutationObserver | undefined => {
  const observer = new MutationObserver(observerCallback)
  const observedElement = element instanceof HTMLElement ? element : select(element)

  if (observedElement && !isElementObserved(observedElement)) {
    observer.observe(observedElement, options)
    setObserverId(dataTag)(observedElement)
    return observer
  }

  return undefined
}

export default observeElement
