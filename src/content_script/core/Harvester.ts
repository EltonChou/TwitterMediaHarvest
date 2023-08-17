import { addBreadcrumb, captureMessage } from '@sentry/browser'
import * as A from 'fp-ts/lib/Array'
import * as IOE from 'fp-ts/lib/IOEither'
import * as O from 'fp-ts/lib/Option'
import { pipe } from 'fp-ts/lib/function'
import { isEmpty, isString } from 'fp-ts/lib/string'
import select from 'select-dom'
import downloadButtonSVG from '../../assets/icons/twitter-download.svg'
import { ParserError } from '../exceptions'
import { isArticlePhotoMode, selectArtcleMode } from '../utils/article'
import { createElementFromHTML, makeButtonListener } from '../utils/maker'
import { toError } from 'fp-ts/lib/Either'

const featureRegEx = Object.freeze({
  id: /(?:status\/)(\d+)/,
  screenName: /(\w+)\/(?:status\/)/,
  photoModeUrl: /\w+\/status\/\d+\/(photo|video)\/\d+/,
})

const getLinksFromArticle = (article: HTMLElement): string[] => {
  if (isArticlePhotoMode(article)) return [window.location.pathname]
  const anchorEles = select.all('[data-testid="User-Name"] [href]', article)
  const timeEle = select('a > time', article)
  if (timeEle?.parentElement?.tagName === 'A') anchorEles.push(timeEle.parentElement)
  return anchorEles.map((e: HTMLAnchorElement) => e?.href).filter(isString)
}

const getTweetIdFromLink = (link: string) => link.match(featureRegEx.id)?.at(1)
const getScreenNameFromLink = (link: string) => link.match(featureRegEx.screenName)?.at(1)

const parseLinks = (parse: (v: string) => string) => (links: string[]) =>
  pipe(
    links,
    A.copy,
    A.reduce('', (pv, cv) => (pv ? pv : parse(cv))),
    O.fromPredicate(v => isString(v) && !isEmpty(v)),
    IOE.fromOption(() => {
      const msg = 'Failed to parse link.' + `(Parser: ${parse.name})`
      addBreadcrumb({
        category: 'parse',
        message: msg,
        level: 'error',
        data: links,
      })
      captureMessage(msg)
      return new ParserError('Failed to parse link.' + `(Parser: ${parse.name})`)
    })
  )

export const parseTweetInfo = (article: HTMLElement): IOE.IOEither<Error, TweetInfo> => {
  addBreadcrumb({
    category: 'parse',
    message: 'Parse tweet info.',
    level: 'info',
  })

  return pipe(
    IOE.of({
      links: getLinksFromArticle(article),
    }),
    IOE.bind('screenName', ctx => pipe(parseLinks(getScreenNameFromLink)(ctx.links))),
    IOE.bind('tweetId', ctx => pipe(parseLinks(getTweetIdFromLink)(ctx.links))),
    IOE.map(ctx => ({
      screenName: ctx.screenName,
      tweetId: ctx.tweetId,
    }))
  )
}

const removeButtonStatsText = (btnContainer: HTMLElement) => {
  select('[data-testid="app-text-transition-container"] > span > span', btnContainer)?.remove()
  return btnContainer
}

const getButtonContainer = (sampleButton: HTMLElement) => pipe(sampleButton.cloneNode(true), removeButtonStatsText)
const swapSvg = (mode: TweetMode) => (button: HTMLElement) => {
  const svg = select('svg', button)
  svg?.previousElementSibling.classList.add(`${mode}BG`)
  svg?.replaceWith(
    makeButtonIcon(svg?.classList.value || 'r-4qtqp9 r-yyyyoo r-1xvli5t r-dnmrzs r-bnwqim r-1plcrui r-lrvibr r-1hdv0qi')
  )
  return button
}

const getActionBar = (article: HTMLElement) =>
  select('[role="group"][aria-label]', article) || select('.r-18u37iz[role="group"][id^="id__"]', article)

const getSampleButton = (article: HTMLElement) =>
  pipe(
    select('[data-testid="reply"] > div', article),
    O.fromNullable,
    IOE.fromOption(() => new ParserError('Failed to get sample button.'))
  )

const makeButton = (mode: TweetMode) => (article: HTMLElement) =>
  pipe(
    article,
    getSampleButton,
    IOE.chain(sampleBtn => pipe(sampleBtn, getButtonContainer, IOE.right)),
    IOE.chain(sampleBtn => pipe(sampleBtn, swapSvg(mode), IOE.right)),
    IOE.chain(btn => pipe(btn, wrapButton(mode), IOE.right)),
    IOE.chain(wrappedBtn => pipe(wrappedBtn, makeMouseHandler(mode), IOE.right)),
    IOE.chain(wrappedBtn => pipe(wrappedBtn, makeButtonListener(parseTweetInfo(article)), IOE.right))
  )

export const makeHarvestButton = (article: HTMLElement) =>
  pipe(
    IOE.Do,
    IOE.bind('mode', () => pipe(selectArtcleMode(article as HTMLElement), IOE.right)),
    IOE.bind('actionBar', () =>
      pipe(
        getActionBar(article),
        O.fromNullable,
        IOE.fromOption(() => new ParserError('Failed to get action bar.'))
      )
    ),
    IOE.bind('buttonWrapper', ctx => makeButton(ctx.mode)(article)),
    IOE.tap(ctx => pipe(ctx.actionBar.appendChild(ctx.buttonWrapper), IOE.right)),
    IOE.mapError(toError),
    IOE.map(() => 'success')
  )

const wrapButton =
  (mode: TweetMode) =>
  (btn: HTMLElement): HTMLElement => {
    const buttonWrapper = createElementFromHTML(`
      <div class="css-1dbjc4n harvester ${mode}">
        <div aria-haspopup="true" aria-label="Media Harvest" role="button" data-focusable="true" tabindex="0" \
        style="display: flex;justify-content: center;">
          ${btn.outerHTML}
        </div>
      </div>
    `)

    return buttonWrapper
  }

const makeMouseHandler = (mode: TweetMode) => (wrappedBtn: HTMLElement) => {
  const bgEle = select(`.${mode}BG`, wrappedBtn)
  const btn = select('[role="button"] > div', wrappedBtn)

  const handleClick = (e: MouseEvent) => {
    if (!bgEle || !btn) return
    bgEle.classList.toggle('click')
    btn.classList.toggle('click')
    e.stopImmediatePropagation()
  }

  btn.addEventListener('mouseover', () => {
    if (!bgEle || !btn) return
    bgEle.classList.add('hover')
    btn.classList.add(`${mode}Color`)
    bgEle.classList.remove('click')
  })
  btn.addEventListener('mouseout', () => {
    if (!bgEle || !btn) return
    bgEle.classList.remove('hover')
    btn.classList.remove(`${mode}Color`)
    bgEle.classList.remove('click')
  })
  btn.addEventListener('mouseup', handleClick)
  btn.addEventListener('mousedown', handleClick)
  return wrappedBtn
}

const makeButtonIcon = (svgStyle: string) => {
  const icon = createElementFromHTML(downloadButtonSVG)
  icon.setAttribute('class', svgStyle)
  // this style can prevent the appearance changed when the reply is restricted.
  icon.setAttribute('style', 'opacity: unset !important;')
  return icon
}
