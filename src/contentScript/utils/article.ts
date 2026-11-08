/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { TweetInfo } from '#domain/valueObjects/tweetInfo'
import { toErrorResult, toSuccessResult } from '#utils/result'
import { isAnonymousMode, isInTweetStatus, isX } from './checker'
import * as A from 'fp-ts/Array'
import * as E from 'fp-ts/Either'
import { fromPredicate as optionFromPredicate } from 'fp-ts/lib/Option'
import { flow, pipe } from 'fp-ts/lib/function'
import { isEmpty, isString } from 'fp-ts/lib/string'
import { $, $$, elementExists } from 'select-dom'

/**
 * <article role="article" data-focusable="true" tabindex="0" class="css-1dbjc4n r-18u37iz r-1ny4l3l r-1udh08x r-1yt7n81 r-ry3cjt">
 *
 * @param {HTMLElement} article
 */
export const isArticleInStatus = (article: HTMLElement) => {
  if (article instanceof HTMLDivElement) return false
  if (isX())
    return elementExists('a[aria-current="page"][href*="/status/"]', article)
  const articleClassLength = article.classList.length
  const isMagicLength =
    articleClassLength === 3 ||
    articleClassLength === 7 ||
    articleClassLength === 6
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
  return (
    articleClassLength === 5 ||
    articleClassLength === 9 ||
    articleClassLength === 10
  )
}

export const isMediaViewerOpenFor = (article: HTMLElement): boolean => {
  if (!article) return false
  const articleAnchor = $('a[href*="/status/"]', article)
  if (!articleAnchor) return false

  const href = articleAnchor.getAttribute('href')
  const viewerAnalyticsAnchor = $(
    `[aria-label="Media Viewer"] a[href^="${href}/"]:not(article a)`
  )

  return Boolean(viewerAnalyticsAnchor)
}

/**
 * In X, a non-article element is the media viewer action bar container.
 *
 * @param {HTMLElement} article
 */
export const isArticlePhotoMode = (article: HTMLElement) =>
  isX()
    ? article.tagName !== 'ARTICLE' || isMediaViewerOpenFor(article)
    : article instanceof HTMLDivElement

/**
 * @param {HTMLElement} article
 */
export const selectArtcleMode = (article: HTMLElement): TweetMode => {
  if (isArticlePhotoMode(article)) return 'photo'
  if (isArticleInStatus(article)) return 'status'
  return 'stream'
}

/** Introduced in 2026-11 */
export const isOwnByEmbedded = (ele: HTMLElement): boolean =>
  Boolean(ele.closest('[data-slot="embedded-tweet-frame"]'))

export const isArticleHasQuotedContent = (article: HTMLElement): boolean =>
  $$('time', article).length > 1 ||
  elementExists('[data-slot="embedded-tweet-frame"]', article)

export const isArticleQuoted = (article: HTMLElement): boolean =>
  Boolean(article?.parentElement?.closest('article')) ||
  isOwnByEmbedded(article)

const makePhotoUrlPattern = (statusHref: string): string => {
  const statusPath = URL.canParse(statusHref)
    ? new URL(statusHref).pathname
    : statusHref
  return statusPath.includes('/photo/') ? statusPath : `${statusPath}/photo`
}

const getPhotoElementByUrl =
  (photoUrl: string) =>
  (article: HTMLElement): HTMLElement | undefined =>
    $<HTMLElement>(`[href*="${photoUrl}"]`, article)

/**
 * The anchor might be history anchor.
 * e.g. `https://x.com/i/web/status/{tweetId}/history`
 */
const getArticleAnchor = (article: HTMLElement) => {
  const anchorTime = $('a[href*="/status/"] > time', article)
  if (anchorTime) return anchorTime.closest('a')
  return $('a[href*="/status/"]', article)
}

const historyAnchorPattern = /\/history$/

const aricleHasPhoto = (article: HTMLElement): boolean => {
  if (isArticlePhotoMode(article)) return true
  const articleAnchor = getArticleAnchor(article)
  if (!articleAnchor) return false

  const href = (articleAnchor.getAttribute('href') ?? '').replace(
    historyAnchorPattern,
    ''
  )

  // this href is relative path.
  const photoUrl = makePhotoUrlPattern(href)
  const photoEle = getPhotoElementByUrl(photoUrl)(article)
  return photoEle ? !isPhotoInQuotedContent(photoEle) : false
}

/**
 * In X, a card's media wrapper is followed by a link with an absolute URL
 * ("From example.com"), unlike X's own relative links. That link renders with
 * the media; the overlay link on the video comes later. A tweet's own card
 * excludes other media of its own, but a quoted tweet can have its own card.
 */
const X_CARD_QUERY =
  'div + a[target="_blank"][href^="http"]:not(article article *, [data-slot="embedded-tweet-frame"] *)'

/** In the legacy frontend, a quoted tweet is a link element, not an article. */
const LEGACY_CARD_QUERY = '[data-testid="card.wrapper"]:not([role="link"] *)'

const isCardArticle = (article: HTMLElement): boolean =>
  elementExists(isX() ? X_CARD_QUERY : LEGACY_CARD_QUERY, article)

const isVideoInQuotedContent = (ele: HTMLElement) =>
  Boolean(ele?.closest('[role="link"]')?.querySelector('time'))
const isPhotoInQuotedContent = (ele: HTMLElement) =>
  Boolean(
    ele?.closest('[id^="id"]:not([aria-labelledby])')?.querySelector('time')
  )

/**
 * Get first video-like component from specified element.
 */
const getFirstVideoComponentFrom = (
  article: HTMLElement
): HTMLElement | undefined =>
  $<HTMLElement>('[data-testid="videoPlayer"]', article) ||
  $<HTMLElement>('[data-testid="playButton"]', article) ||
  $<HTMLElement>('[data-testid="videoComponent"]', article) ||
  $<HTMLElement>('video', article)

const articleHasVideo = (article: HTMLElement): boolean => {
  const videoComponent = getFirstVideoComponentFrom(article)
  if (!videoComponent) return false
  return (
    !isOwnByEmbedded(videoComponent) && !isVideoInQuotedContent(videoComponent)
  )
}

export const articleHasMedia = (article: HTMLElement) => {
  if (!article) return false
  if (isArticlePhotoMode(article)) return true
  if (isCardArticle(article)) return false
  return articleHasVideo(article) || aricleHasPhoto(article)
}

export const findButton = (article: HTMLElement): HTMLElement | undefined =>
  $<HTMLElement>('.deck-harvester', article) ||
  $<HTMLElement>('.harvester', article)

export const canArticleBeAppended = (article: HTMLElement) =>
  !(
    elementExists('.deck-harvester', article) ||
    elementExists('.harvester', article)
  )

export const parseTweetInfo = (article: HTMLElement) =>
  pipe(
    E.Do,
    E.bind('links', () =>
      pipe(
        article,
        getLinksFromArticle,
        A.match(
          () => E.left('Failed to get links from article.'),
          links => E.right(links)
        )
      )
    ),
    E.bind('screenName', ({ links }) =>
      pipe(
        links,
        parseLinks(getScreenNameFromLink),
        E.fromOption(() => 'Failed to get screen name.')
      )
    ),
    E.bind('tweetId', ({ links }) =>
      pipe(
        links,
        parseLinks(getTweetIdFromLink),
        E.fromOption(() => 'Failed to get tweet id.')
      )
    ),
    E.map(
      ctx =>
        new TweetInfo({
          screenName: ctx.screenName,
          tweetId: ctx.tweetId,
        })
    )
  )

const featureRegEx = Object.freeze({
  id: /(?:status\/)(\d+)/,
  screenName: /(\w+)\/(?:status\/)/,
  photoModeUrl: /\w+\/status\/\d+\/(photo|video)\/\d+/,
  editedHistoryUrl: /(?<=.+)\/history$/,
})

const getLinksFromPhotoMode = (article: HTMLElement): HTMLElement[] =>
  $$('[href*="analytics"]', article)

const getLinksFromXArticle = (article: HTMLElement): HTMLElement[] => {
  if (isArticleInStatus(article))
    return $$('a[aria-current="page"][href*="status"]', article)

  const parentLinks = article?.parentElement
    ? $$(':scope > a', article.parentElement)
    : []
  if (parentLinks.length > 0) return parentLinks

  // The media viewer's focused tweet has neither link. Unlike its quoted tweet,
  // it has an analytics link.
  return $$('a[href*="/status/"][href$="/analytics"]', article)
}

const getLinksFromTwitterArticle = (article: HTMLElement): HTMLElement[] =>
  $$('[data-testid="User-Name"] [href]', article)

export const getLinksFromArticle = (article: HTMLElement): string[] => {
  const anchorEles = isArticlePhotoMode(article)
    ? getLinksFromPhotoMode(article)
    : isX()
      ? getLinksFromXArticle(article)
      : getLinksFromTwitterArticle(article)

  const timeEle = $('a > time', article)
  if (timeEle?.parentElement?.tagName === 'A')
    anchorEles.push(timeEle.parentElement)

  if (anchorEles.length > 0)
    return anchorEles
      .filter(e => e.hasAttribute('href'))
      .map(e => e.getAttribute('href'))
      .filter(href => href !== null)
      .map(path => path.replace(featureRegEx.editedHistoryUrl, ''))

  // Use meta element to parse link of tweet.
  if (isAnonymousMode()) {
    const anchorEle = $('a[data-base-ui-tooltip-trigger]', article)
    if (anchorEle) return [anchorEle.href]

    const urlMeta = $('meta[itemprop="url"]', article)
    if (urlMeta)
      return [urlMeta.content.replace(featureRegEx.editedHistoryUrl, '')]
  }

  return []
}

export const getTweetIdFromLink = (link: string) =>
  link.match(featureRegEx.id)?.at(1)
export const getScreenNameFromLink = (link: string) =>
  link.match(featureRegEx.screenName)?.at(1)

export const parseLinks =
  (parse: (v: string) => string | undefined) => (links: string[]) =>
    pipe(
      links,
      A.reduce('', (previous, current) => {
        if (isEmpty(previous)) return parse(current) ?? ''
        return previous
      }),
      optionFromPredicate(v => isString(v) && !isEmpty(v))
    )

const TARGET_ARTICLE_DATASET_CRITERIA = 'harvestArticle'

export const setTargetArticle = <T extends HTMLElement | undefined | null>(
  article: T
) => {
  if (article) {
    article.dataset[TARGET_ARTICLE_DATASET_CRITERIA] = 'true'
  }
  return article
}

export const getClosedTargetArticle = <T extends Element>(ele: T) =>
  ele.closest<T>('[data-harvest-article]')

export const getTweetInfoFromArticleChildElement = <T extends HTMLElement>(
  childElement: T
): Result<TweetInfo> =>
  pipe(
    childElement,
    getClosedTargetArticle,
    E.fromNullable('Failed to get target article when parsing tweet info.'),
    E.flatMap(parseTweetInfo),
    E.match(flow(E.toError, toErrorResult<TweetInfo>), toSuccessResult)
  )
