import select from 'select-dom'
import { isBusinessRelatedTweet } from './checker'

export const revealNsfw = (article: HTMLElement) => {
  if (!article || article.dataset['autoReveal'] || isBusinessRelatedTweet(article)) return
  const revealButton = select('button [style*="blur"]', article)
  if (revealButton) {
    article.dataset['autoReveal'] = 'true'
    revealButton.click()
  }
}
