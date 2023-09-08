import downloadButtonSVG from '../../assets/icons/twitter-download.svg'
import { ParserError } from '../exceptions'
import { isArticlePhotoMode, selectArtcleMode } from '../utils/article'
import { createElementFromHTML, makeButtonListener } from '../utils/maker'
import { addBreadcrumb } from '@sentry/browser'
import { copy as arrCopy, reduce as arrReduce } from 'fp-ts/lib/Array'
import { fromNullable as eitherNullable, toError } from 'fp-ts/lib/Either'
import * as IOE from 'fp-ts/lib/IOEither'
import { fromPredicate as optionFromPredicate } from 'fp-ts/lib/Option'
import { pipe } from 'fp-ts/lib/function'
import { isEmpty, isString } from 'fp-ts/lib/string'
import select from 'select-dom'

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

const parseLinks =
  (parserName: string) => (parse: (v: string) => string) => (links: string[]) =>
    pipe(
      links,
      arrCopy,
      arrReduce('', (pv, cv) => (pv ? pv : parse(cv))),
      optionFromPredicate(v => isString(v) && !isEmpty(v)),
      IOE.fromOption(() => {
        const msg = 'Failed to parse link.' + `(Parser: ${parserName})`
        addBreadcrumb({
          category: 'parse',
          message: msg,
          level: 'error',
          data: {
            links,
          },
        })
        return new ParserError(msg)
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
    IOE.bind('screenName', ({ links }) =>
      pipe(links, parseLinks('screenName')(getScreenNameFromLink))
    ),
    IOE.bind('tweetId', ({ links }) =>
      pipe(links, parseLinks('tweetId')(getTweetIdFromLink))
    ),
    IOE.map(ctx => ({
      screenName: ctx.screenName,
      tweetId: ctx.tweetId,
    }))
  )
}

const removeButtonStatsText = (btnContainer: HTMLElement) => {
  select(
    '[data-testid="app-text-transition-container"] > span > span',
    btnContainer
  )?.remove()
  return btnContainer
}

const getButtonContainer = (sampleButton: HTMLElement) =>
  pipe(sampleButton.cloneNode(true), removeButtonStatsText)

const swapSvg = (mode: TweetMode) => (button: HTMLElement) => {
  const svg = select('svg', button)
  svg?.previousElementSibling.classList.add(`${mode}BG`)
  svg?.replaceWith(
    makeButtonIcon(
      svg?.classList.value ||
        'r-4qtqp9 r-yyyyoo r-1xvli5t r-dnmrzs r-bnwqim r-1plcrui r-lrvibr r-1hdv0qi'
    )
  )
  return button
}

const getActionBar = (article: HTMLElement) =>
  pipe(
    select('[role="group"][aria-label]', article) ||
      select('.r-18u37iz[role="group"][id^="id__"]', article),
    eitherNullable(() => new ParserError('Failed to get action bar.'))
  )

const getSampleButton = (article: HTMLElement) =>
  pipe(
    select('[data-testid="reply"] > div', article),
    eitherNullable(() => new ParserError('Failed to get sample button.'))
  )

const makeButton = (mode: TweetMode) => (article: HTMLElement) =>
  pipe(
    getSampleButton(article),
    IOE.fromEither,
    IOE.chain(sampleBtn => pipe(sampleBtn, getButtonContainer, IOE.of)),
    IOE.chain(sampleBtn => pipe(sampleBtn, swapSvg(mode), IOE.of)),
    IOE.chain(btn => pipe(btn, wrapButton(mode), IOE.of)),
    IOE.chain(wrappedBtn =>
      pipe(wrappedBtn, makeButtonListener(parseTweetInfo(article)), IOE.of)
    )
  )

export const makeHarvestButton = (article: HTMLElement) =>
  pipe(
    IOE.Do,
    IOE.bind('mode', () => pipe(selectArtcleMode(article), IOE.of)),
    IOE.bind('actionBar', () => pipe(getActionBar(article), IOE.fromEither)),
    IOE.bind('buttonWrapper', ctx => makeButton(ctx.mode)(article)),
    IOE.tap(ctx => pipe(ctx.actionBar.appendChild(ctx.buttonWrapper), IOE.of)),
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

const makeButtonIcon = (svgStyle: string) => {
  const icon = createElementFromHTML(downloadButtonSVG)
  icon.setAttribute('class', svgStyle)
  // this style can prevent the appearance changed when the reply is restricted.
  icon.setAttribute('style', 'opacity: unset !important;')
  return icon
}
