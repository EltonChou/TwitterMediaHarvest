import downloadButtonSVG from '../../assets/icons/twitter-download.svg'
import { selectArtcleMode } from '../utils/article'
import { createElementFromHTML, makeButtonListener } from '../utils/maker'
import * as E from 'fp-ts/Either'
import * as IOO from 'fp-ts/IOOption'
import * as O from 'fp-ts/Option'
import * as IOE from 'fp-ts/lib/IOEither'
import { pipe } from 'fp-ts/lib/function'
import { isEmpty } from 'fp-ts/lib/string'
import select from 'select-dom'

const removeButtonStatsText = (btnContainer: HTMLElement) => {
  select(
    '[data-testid="app-text-transition-container"] > span > span',
    btnContainer
  )?.remove()
  return btnContainer
}

const bleachButton = (sampleButton: HTMLElement) =>
  pipe(sampleButton.cloneNode(true) as HTMLElement, removeButtonStatsText, IOE.of)

const getIcon = <T extends HTMLElement>(button: T) =>
  pipe(select('svg', button), E.fromNullable('Failed to get icon svg.'))

const swapIcon = <T extends HTMLElement>(icon: T) =>
  pipe(
    IOO.of({ icon }),
    IOO.bind('newIcon', () =>
      pipe(
        isEmpty(icon.classList.value)
          ? 'r-4qtqp9 r-yyyyoo r-1xvli5t r-dnmrzs r-bnwqim r-1plcrui r-lrvibr r-1hdv0qi'
          : icon.classList.value,
        makeButtonIcon,
        IOO.of
      )
    ),
    IOO.tap(({ icon, newIcon }) => pipe(newIcon, icon.replaceWith, IOO.of)),
    IOO.map(() => void 0)
  )

const richIconSibling =
  (mode: TweetMode) =>
  <T extends HTMLElement>(icon: T) =>
    pipe(icon.previousElementSibling?.classList.add(`${mode}BG`), IOO.of)

const getActionBar = (article: HTMLElement) =>
  pipe(
    select('[role="group"][aria-label]', article) ||
      select('.r-18u37iz[role="group"][id^="id__"]', article),
    E.fromNullable('Failed to get action bar.')
  )

const getSampleButton = (article: HTMLElement) =>
  pipe(
    select('[data-testid="reply"] > div', article),
    E.fromNullable('Failed to get sample button')
  )

const makeButton = (mode: TweetMode) => (article: HTMLElement) =>
  pipe(
    IOE.of({ article, mode }),
    IOE.bind('btn', ({ article, mode }) =>
      pipe(
        article,
        getSampleButton,
        IOE.fromEither,
        IOE.tap(btn =>
          pipe(
            btn,
            getIcon,
            IOO.fromEither,
            IOO.tap(icon => pipe(icon, richIconSibling(mode))),
            IOO.tap(icon => pipe(icon, swapIcon)),
            IOE.fromIO
          )
        ),
        IOE.flatMap(bleachButton),
        IOE.flatMap(bleachedButton => pipe(bleachedButton, wrapButton(mode), IOE.of))
      )
    ),
    IOE.map(({ btn }) => makeButtonListener(btn))
  )

export const makeHarvestButton = (article: HTMLElement) =>
  pipe(
    IOE.Do,
    IOE.bind('mode', () => pipe(article, selectArtcleMode, IOE.of)),
    IOE.bind('actionBar', () => pipe(article, getActionBar, IOE.fromEither)),
    IOE.bind('button', ctx => makeButton(ctx.mode)(article)),
    IOE.tap(ctx => pipe(ctx.button, ctx.actionBar.appendChild, IOE.of)),
    IOE.map(() => 'success')
  )

const wrapButton =
  (mode: TweetMode) =>
  (btn: HTMLElement): HTMLElement =>
    createElementFromHTML(`
      <div class="harvester ${mode}">
        <div aria-haspopup="true" aria-label="Media Harvest" role="button" data-focusable="true" tabindex="0" \
        style="display: flex;justify-content: center;">
          ${btn.outerHTML}
        </div>
      </div>
    `)

const makeButtonIcon = (svgStyle: string) => {
  const icon = createElementFromHTML(downloadButtonSVG)
  icon.setAttribute('class', svgStyle)
  // this style can prevent the appearance changed when the reply is restricted.
  icon.setAttribute('style', 'opacity: unset !important;')
  return icon
}
