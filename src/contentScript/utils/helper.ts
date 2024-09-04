import { isBusinessRelatedTweet } from './checker'
import select from 'select-dom'

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
