/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { $ } from 'select-dom'

export const OBSERVE_ID_CRITERIA = 'harvestObserveId'

export const isElementObserved = <T extends HTMLElement = HTMLElement>(
  ele: T
) => Object.hasOwn(ele.dataset, OBSERVE_ID_CRITERIA)

export const setObserverId =
  (id: string) =>
  <T extends HTMLElement = HTMLElement>(ele: T): T => {
    ele.dataset[OBSERVE_ID_CRITERIA] = id
    return ele
  }

/**
 * MutationObserver
 * @param observeId value of `data-harvest-observe-id` for observed element
 * @param element valid DOMSelector string or HTMLElement
 * @param observerCallback MutationsObserver callback
 * @param options MutationsObserver options
 */
export const observeElement = (
  observeId: string,
  element: HTMLElement | string,
  observerCallback: MutationCallback,
  options: MutationObserverInit = { childList: true }
): MutationObserver | undefined => {
  const observedElement = element instanceof HTMLElement ? element : $(element)

  if (observedElement && !isElementObserved(observedElement)) {
    const observer = new MutationObserver(observerCallback)
    observer.observe(observedElement, options)
    setObserverId(observeId)(observedElement)
    return observer
  }

  return undefined
}

export default observeElement
