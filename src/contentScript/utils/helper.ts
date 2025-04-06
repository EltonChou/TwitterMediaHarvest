/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { isBusinessRelatedTweet } from './checker'
import { $ } from 'select-dom'

/**
 * Create HTMLElement from html string.
 *
 * @param htmlString A valid html string.
 */
export const createElementFromHTML = (htmlString: string): HTMLElement => {
  const wrapper = document.createElement('div')
  wrapper.innerHTML = htmlString.trim()
  return wrapper.firstElementChild as HTMLElement
}
export const revealNsfw = (article: HTMLElement) => {
  if (
    !article ||
    article.dataset['autoReveal'] ||
    isBusinessRelatedTweet(article)
  )
    return
  if (article.tagName === 'LI') {
    $('[role="button"]', article)?.click()
    return
  }

  const revealButton = $('[role="button"][style*="blur"]', article)
  if (revealButton) {
    article.dataset['autoReveal'] = 'true'
    revealButton.click()
  }
}
