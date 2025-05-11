/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import downloadButtonSVG from '#assets/icons/twitter-download.svg'
import { selectArtcleMode } from '../utils/article'
import { checkButtonStatus, makeButtonListener } from '../utils/button'
import { createElementFromHTML } from '../utils/helper'
import * as E from 'fp-ts/Either'
import * as IOE from 'fp-ts/IOEither'
import { flow, pipe } from 'fp-ts/function'
import { $ } from 'select-dom'

const removeButtonStatsText = (btnContainer: HTMLElement) =>
  $(
    '[data-testid="app-text-transition-container"] > span > span',
    btnContainer
  )?.remove()

const bleachButton = <T extends HTMLElement>(sampleButton: T) => {
  const emptyButton = sampleButton.cloneNode(true) as T
  removeButtonStatsText(emptyButton)
  return emptyButton
}

const getIcon = <T extends HTMLElement>(button: T) =>
  pipe($('svg', button), E.fromNullable('Failed to get icon svg.'))

const getIconStyle = <T extends HTMLElement>(icon: T) =>
  icon?.classList?.value ??
  'r-4qtqp9 r-yyyyoo r-1xvli5t r-dnmrzs r-bnwqim r-1plcrui r-lrvibr r-1hdv0qi'

const swapIcon = <T extends HTMLElement>(icon: T) =>
  pipe(
    E.of(icon),
    E.flatMap(flow(getIconStyle, makeButtonIcon, E.of)),
    E.tap(buttonIcon => pipe(icon.replaceWith(buttonIcon), E.of))
  )

const richIconSibling =
  (mode: TweetMode) =>
  <T extends HTMLElement>(icon: T) =>
    icon.previousElementSibling?.classList.add(`${mode}BG`)

const getActionBar = (article: HTMLElement) =>
  pipe(
    $('[role="group"][aria-label]', article) ||
      $('.r-18u37iz[role="group"][id^="id__"]', article),
    E.fromNullable('Failed to get action bar.')
  )

const getSampleButton = (article: HTMLElement) =>
  pipe(
    $('[data-testid="reply"] > div', article),
    E.fromNullable('Failed to get sample button')
  )

const makeButton = (mode: TweetMode) => (article: HTMLElement) =>
  pipe(
    E.Do,
    E.bind('wipButton', () =>
      pipe(article, getSampleButton, E.flatMap(flow(bleachButton, E.of)))
    ),
    E.tap(({ wipButton }) =>
      pipe(wipButton, getIcon, E.flatMap(flow(swapIcon)))
    ),
    E.bind('fullButton', ({ wipButton }) => pipe(wipButton, wrapButton(mode))),
    E.tap(({ fullButton }) =>
      pipe(fullButton, getIcon, E.flatMap(flow(richIconSibling(mode), E.of)))
    ),
    E.tap(({ fullButton }) => pipe(fullButton, makeButtonListener, E.of)),
    E.map(ctx => ctx.fullButton)
  )

export const makeHarvestButton = (article: HTMLElement) =>
  pipe(
    IOE.Do,
    IOE.bind('mode', () => pipe(article, selectArtcleMode, IOE.of)),
    IOE.bind('actionBar', () => pipe(article, getActionBar, IOE.fromEither)),
    IOE.bind('button', ctx =>
      pipe(makeButton(ctx.mode)(article), IOE.fromEither)
    ),
    IOE.tap(ctx => pipe(ctx.actionBar.appendChild(ctx.button), IOE.of)),
    IOE.tap(ctx => pipe(checkButtonStatus(ctx.button), IOE.of)),
    IOE.map(() => 'ok')
  )

const wrapButton = (mode: TweetMode) => (button: HTMLElement) =>
  pipe(
    E.of({
      wrapper: createElementFromHTML(`
      <div class="harvester ${mode}" data-testid="harvester-button" data-harvest-ref="U2FsdGVkX18434vXoO+1oS21I0YQm8zFX6xy775AvdCpmSEOQHO9ns7wa518zD8t">
        <div aria-haspopup="true" aria-label="Media Harvest" role="button" data-focusable="true" tabindex="0" \
        style="display: flex;justify-content: center;"></div>
      </div>
      `),
    }),
    E.tap(({ wrapper }) =>
      pipe(
        wrapper.querySelector('.harvester > div'),
        E.fromNullable('Failed to get inner wrapper.'),
        E.tap(innerWrapper => pipe(innerWrapper.appendChild(button), E.of))
      )
    ),
    E.map(ctx => ctx.wrapper)
  )

const makeButtonIcon = (svgStyle: string) => {
  const icon = createElementFromHTML(downloadButtonSVG)
  icon.setAttribute('class', svgStyle)
  // this style can prevent the appearance changed when the reply is restricted.
  icon.setAttribute('style', 'opacity: unset !important;')
  return icon
}
