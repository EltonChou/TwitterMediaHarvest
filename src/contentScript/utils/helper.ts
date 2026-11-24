/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { isBusinessRelatedTweet } from './checker'
import { $, $$ } from 'select-dom'

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
/**
 * The media grid has no reveal button: a `blur-*` wrapper holds the image and
 * its next sibling is the warning overlay. Style them, React keeps the nodes.
 */
// ponytail: keyed on X's tailwind `blur-` class; switch to computed filter if it renames.
export const revealGridTiles = (li: HTMLElement) => {
  for (const img of $$('[role="listitem"] img', li)) {
    const blur = img.parentElement
    if (!blur || !/(^|\s)blur-/.test(blur.className)) continue
    blur.style.filter = 'none'
    if (blur.nextElementSibling instanceof HTMLElement)
      blur.nextElementSibling.style.display = 'none'
  }
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
