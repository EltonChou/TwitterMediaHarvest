import { TweetInfo } from '#domain/valueObjects/tweetInfo'
import { toErrorResult, toSuccessResult } from '#utils/result'
import { isInTweetStatus } from './checker'
import * as A from 'fp-ts/Array'
import * as E from 'fp-ts/Either'
import { fromPredicate as optionFromPredicate } from 'fp-ts/lib/Option'
import { pipe } from 'fp-ts/lib/function'
import { isEmpty, isString } from 'fp-ts/lib/string'
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

const getArticleAnchor = (article: HTMLElement) => select('[href*="/status/"]', article)

const aricleHasPhoto = (article: HTMLElement): boolean => {
  const articleAnchor = getArticleAnchor(article)
  if (!articleAnchor) return false
  const photoUrl = makePhotoUrlPattern(articleAnchor.getAttribute('href') ?? '')
  const photoEle = getPhotoElementByUrl(photoUrl)(article)
  return photoEle ? !isPhotoInQuotedContent(photoEle) : false
}

const getVideoCompoent = (article: HTMLElement): HTMLElement | undefined =>
  select('[data-testid="videoPlayer"]', article) ||
  select('[data-testid="playButton"]', article) ||
  select('[data-testid="videoComponent"]', article)

const articleHasVideo = (article: HTMLElement): boolean => {
  const videoComponent = getVideoCompoent(article)
  return Boolean(
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
})

export const getLinksFromArticle = (article: HTMLElement): string[] => {
  const parentArticle = article.closest('article')
  if (!parentArticle || isArticlePhotoMode(article)) return [window.location.pathname]
  const anchorEles = select.all('[data-testid="User-Name"] [href]', article)
  const timeEle = select('a > time', article)
  if (timeEle?.parentElement?.tagName === 'A') anchorEles.push(timeEle.parentElement)
  return anchorEles
    .filter(e => e.hasAttribute('href'))
    .map(e => e.getAttribute('href'))
    .filter(isString)
}

export const getTweetIdFromLink = (link: string) => link.match(featureRegEx.id)?.at(1)
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

export const isTargetArticle = <T extends HTMLElement | undefined | null>(
  article: T
): boolean => Boolean(article && article.dataset[TARGET_ARTICLE_DATASET_CRITERIA])

export const getClosedTargetArticle = <T extends Element>(ele: T) =>
  ele.closest<T>('[data-harvest-article]')

export const getTweetInfoFromArticleChiledElement = <T extends HTMLElement>(
  childElement: T
): Result<TweetInfo> =>
  pipe(
    childElement,
    getClosedTargetArticle,
    E.fromNullable('Failed to get target article when parsing tweet info.'),
    E.flatMap(article => pipe(article, parseTweetInfo)),
    E.match(
      errorMsg => pipe(errorMsg, E.toError, toErrorResult),
      tweetInfo => toSuccessResult(tweetInfo)
    )
  )