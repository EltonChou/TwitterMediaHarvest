import downloadButtonSVG from '#assets/icons/twitter-download.svg'
import { selectArtcleMode } from '../utils/article'
import { checkButtonStatus, makeButtonListener } from '../utils/button'
import { createElementFromHTML } from '../utils/helper'
import * as E from 'fp-ts/Either'
import * as IOE from 'fp-ts/IOEither'
import * as IOO from 'fp-ts/IOOption'
import { pipe } from 'fp-ts/function'
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

const getIconStyle = <T extends HTMLElement>(icon: T) =>
  icon.classList.value ||
  'r-4qtqp9 r-yyyyoo r-1xvli5t r-dnmrzs r-bnwqim r-1plcrui r-lrvibr r-1hdv0qi'

const swapIcon = <T extends HTMLElement>(icon: T) =>
  pipe(
    IOO.of({ icon }),
    IOO.bind('newIcon', ({ icon }) => pipe(icon, getIconStyle, makeButtonIcon, IOO.of)),
    IOO.tap(({ icon, newIcon }) => pipe(icon.replaceWith(newIcon), IOO.of)),
    IOO.map(ctx => ctx.newIcon)
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

const generateButton = (mode: TweetMode) => (sampleButton: HTMLElement) =>
  pipe(
    sampleButton,
    getIcon,
    IOO.fromEither,
    IOO.tap(icon => pipe(icon, richIconSibling(mode))),
    IOO.tap(icon => pipe(icon, swapIcon)),
    IOE.fromIO
  )

const makeButton = (mode: TweetMode) => (article: HTMLElement) =>
  pipe(
    IOE.of({ article, mode }),
    IOE.bind('fullButton', ({ article, mode }) =>
      pipe(
        article,
        getSampleButton,
        IOE.fromEither,
        IOE.tap(generateButton(mode)),
        IOE.flatMap(bleachButton),
        IOE.flatMap(bleachedButton => pipe(bleachedButton, wrapButton(mode)))
      )
    ),
    IOE.map(({ fullButton }) => makeButtonListener(fullButton)),
  )

export const makeHarvestButton = (article: HTMLElement) =>
  pipe(
    IOE.Do,
    IOE.bind('mode', () => pipe(article, selectArtcleMode, IOE.of)),
    IOE.bind('actionBar', () => pipe(article, getActionBar, IOE.fromEither)),
    IOE.bind('button', ctx => makeButton(ctx.mode)(article)),
    IOE.tap(ctx => pipe(ctx.actionBar.appendChild(ctx.button), IOE.of)),
    IOE.tap(ctx => pipe(checkButtonStatus(ctx.button), IOE.of)),
    IOE.map(() => 'ok')
  )

const wrapButton = (mode: TweetMode) => (btn: HTMLElement) =>
  pipe(
    IOE.of({
      button: btn,
      wrapper: createElementFromHTML(`
      <div class="harvester ${mode}" data-testid="harvester-button">
        <div aria-haspopup="true" aria-label="Media Harvest" role="button" data-focusable="true" tabindex="0" \
        style="display: flex;justify-content: center;"></div>
      </div>
    `),
    }),
    IOE.tap(ctx =>
      pipe(
        ctx.wrapper.querySelector('.harvester > div'),
        E.fromNullable('Failed to wrap button.'),
        IOE.fromEither,
        IOE.tap(wrapper => pipe(wrapper.appendChild(ctx.button), IOE.of))
      )
    ),
    IOE.map(ctx => ctx.wrapper)
  )

const makeButtonIcon = (svgStyle: string) => {
  const icon = createElementFromHTML(downloadButtonSVG)
  icon.setAttribute('class', svgStyle)
  // this style can prevent the appearance changed when the reply is restricted.
  icon.setAttribute('style', 'opacity: unset !important;')
  return icon
}
