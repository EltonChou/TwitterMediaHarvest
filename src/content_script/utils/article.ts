import { isInTweetStatus } from './checker'
import select from 'select-dom'

export const isArticleInDetail = (article: HTMLElement) =>
  select.exists('.tweet-detail', article)

/**
 * <article role="article" data-focusable="true" tabindex="0" class="css-1dbjc4n r-18u37iz r-1ny4l3l r-1udh08x r-1yt7n81 r-ry3cjt">
 *
 * @param {HTMLElement} article
 */
export const isArticleInStatus = (article: HTMLElement) => {
  const articleClassLength = article.classList.length
  const isMagicLength =
    articleClassLength === 3 || articleClassLength === 7 || articleClassLength === 6
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
export const isArticlePhotoMode = (article: HTMLElement) =>
  article instanceof HTMLDivElement

/**
 * @param {HTMLElement} article
 */
export const selectArtcleMode = (article: HTMLElement): TweetMode => {
  if (isArticlePhotoMode(article)) return 'photo'
  if (isArticleInStatus(article)) return 'status'
  return 'stream'
}

export const isAritcleHasQuotedContent = (article: HTMLElement): boolean =>
  select.all('time', article).length > 1

const makePhotoUrlPattern = (statusHref: string): string => {
  const statusUrl = new URL(statusHref)
  return statusUrl.pathname.includes('/photo/')
    ? statusUrl.pathname
    : `${statusUrl.pathname}/photo`
}

const getPhotoElementByUrl =
  (photoUrl: string) =>
  (article: HTMLElement): HTMLElement | undefined =>
    select(`[href*="${photoUrl}"]`, article)

/**
 * A tweet always(looks like) has a time element wrapped by anchor with permalink of tweet.
 *
 * So the parser should try finding this time element then checks its ancestor is anchor or not.
 * If there is no permalink anchor, fuzzily search element which might has permalink.
 */
const getArticleAnchor = (article: HTMLElement): HTMLAnchorElement | undefined => {
  const anchorTime = select('a[href*="/status/"] > time', article)
  if (anchorTime) return anchorTime.closest('a')
  return select('[href*="/status/"]', article)
}

const aricleHasPhoto = (article: HTMLElement): boolean => {
  const articleAnchor = getArticleAnchor(article)
  if (!articleAnchor) return false
  const photoUrl = makePhotoUrlPattern(articleAnchor.href)
  const photoEle = getPhotoElementByUrl(photoUrl)(article)
  return photoEle ? !isPhotoInQuotedContent(photoEle) : false
}

const getVideoCompoent = (article: HTMLElement): HTMLElement | undefined =>
  select('[data-testid="videoPlayer"]', article) ||
  select('[data-testid="playButton"]', article) ||
  select('[data-testid="videoComponent"]', article)

const articleHasVideo = (article: HTMLElement): boolean => {
  const videoComponent = getVideoCompoent(article)
  return (
    videoComponent &&
    !isVideoInQuotedContent(videoComponent) &&
    !isBelongsToCard(videoComponent)
  )
}

const isBelongsToCard = (ele: HTMLElement): boolean =>
  Boolean(ele?.closest('[data-testid="card.wrapper"]'))
const isVideoInQuotedContent = (ele: HTMLElement) =>
  Boolean(ele?.closest('[role="link"]')?.querySelector('time'))
const isPhotoInQuotedContent = (ele: HTMLElement) =>
  Boolean(ele?.closest('[id^="id"]:not([aria-labelledby])')?.querySelector('time'))

export const articleHasMedia = (article: HTMLElement) =>
  article && (articleHasVideo(article) || aricleHasPhoto(article))

export const isArticleCanBeAppend = (article: HTMLElement) =>
  !(select.exists('.deck-harvester', article) || select.exists('.harvester', article))

export const getParentArticle = (ele: HTMLElement): HTMLElement => ele.closest('article')
