import { isBusinessRelatedTweet } from './checker'
import { captureException, captureMessage } from '@sentry/browser'
import type { IO } from 'fp-ts/lib/IO'
import select from 'select-dom'

export const revealNsfw = (article: HTMLElement) => {
  if (!article || article.dataset['autoReveal'] || isBusinessRelatedTweet(article)) return
  const revealButton = select('[role="button"][style*="blur"]', article)
  if (revealButton) {
    article.dataset['autoReveal'] = 'true'
    revealButton.click()
  }
}

export const captureExceptionIO =
  (e: Error): IO<void> =>
  () => {
    captureException(e)
    console.error(e)
  }

export const captureMessageIO =
  (message: string): IO<void> =>
  () => {
    captureMessage(message)
    console.log(message)
  }
