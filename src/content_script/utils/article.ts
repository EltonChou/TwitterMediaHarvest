import select from 'select-dom'
import { isInTweetStatus } from './checker'

export const isArticleInDetail = (article: HTMLElement) => select.exists('.tweet-detail', article)

/**
 * <article role="article" data-focusable="true" tabindex="0" class="css-1dbjc4n r-18u37iz r-1ny4l3l r-1udh08x r-1yt7n81 r-ry3cjt">
 *
 * @param {HTMLElement} article
 */
export const isArticleInStatus = (article: HTMLElement) => {
  const articleClassLength = article.classList.length
  const isMagicLength = articleClassLength === 3 || articleClassLength === 7 || articleClassLength === 6
  return isInTweetStatus() && isMagicLength
}

/**
 * !! CAUTION: This function relied on magic number
 * <article role="article" data-focusable="true" tabindex="0" class="css-1dbjc4n r-1loqt21 r-18u37iz r-1ny4l3l r-1udh08x r-1yt7n81 r-ry3cjt r-o7ynqc r-6416eg">
 *
 * @param {HTMLElement} article
 */
export const isArticleInStream = (article: HTMLElement) => {
  const articleClassLength = article.classList.length
  return articleClassLength === 5 || articleClassLength === 9 || articleClassLength === 10
}

/**
 * @param {HTMLElement} article
 */
export const isArticlePhotoMode = (article: HTMLElement) => article instanceof HTMLDivElement

/**
 * @param {HTMLElement} article
 */
export const selectArtcleMode = (article: HTMLElement): TweetMode => {
  if (isArticlePhotoMode(article)) return 'photo'
  if (isArticleInStatus(article)) return 'status'
  return 'stream'
}

export const isAritcleHasQuotedContent = (article: HTMLElement): boolean => select.all('time', article).length > 1

const aricleHasPhoto = (article: HTMLElement): boolean => {
  const articleAnchor: HTMLAnchorElement = select('[href*="status"]', article)
  if (!articleAnchor) return false
  const statusUrl = new URL(articleAnchor.href)
  const photoUrl = statusUrl.pathname.includes('/photo/') ? statusUrl.pathname : `${statusUrl.pathname}/photo`
  return select.exists(`[href*="${photoUrl}"]`, article)
}

const articleHasVideo = (article: HTMLElement): boolean => {
  const videoComponent =
    select('[data-testid="videoPlayer"]', article) ||
    select('[data-testid="playButton"]', article) ||
    select('[data-testid="videoComponent"]', article)
  return videoComponent ? !isInQuotedContent(videoComponent) : false
}

const isInQuotedContent = (ele: HTMLElement) => Boolean(ele.closest('[role="link"]'))

export const articleHasMedia = (article: HTMLElement) =>
  article ? articleHasVideo(article) || aricleHasPhoto(article) : false

export const isArticleCanBeAppend = (article: HTMLElement) =>
  !(select.exists('.deck-harvester', article) || select.exists('.harvester', article))
