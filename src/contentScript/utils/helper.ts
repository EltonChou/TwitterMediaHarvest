import { isBusinessRelatedTweet } from './checker'
import select from 'select-dom'

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
  if (!article || article.dataset['autoReveal'] || isBusinessRelatedTweet(article)) return
  if (article.tagName === 'LI') {
    select('[role="button"]', article)?.click()
    return
  }

  const revealButton = select('[role="button"][style*="blur"]', article)
  if (revealButton) {
    article.dataset['autoReveal'] = 'true'
    revealButton.click()
  }
}
