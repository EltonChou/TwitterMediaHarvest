/**
 * @jest-environment jsdom
 */
import { isSuccessResult } from '#utils/result'
import { bleachButton, makeHarvestButton } from './Harvester'
import { screen } from '@testing-library/dom'
import { pipe } from 'fp-ts/lib/function'
import { runtime } from 'webextension-polyfill'

const setPath = (path: string) => history.replaceState(null, '', path)

jest.mock(
  '#assets/icons/twitter-download.svg',
  () =>
    `<svg x="0px" y="0px" viewBox="0 0 24 24" style="enable-background:new 0 0 24 24;">
	<g>
		<path d="M12,16l-5.7-5.7l1.4-1.4l3.3,3.3V2.6h2v9.6l3.3-3.3l1.4,1.4L12,16z M21,15l0,3.5c0,1.4-1.1,2.5-2.5,2.5h-13
		C4.1,21,3,19.9,3,18.5V15h2v3.5C5,18.8,5.2,19,5.5,19h13c0.3,0,0.5-0.2,0.5-0.5l0-3.5H21z"/>
		<path></path>
		<path></path>
	</g>
</svg>
`
)

/** `isArticleInStream` and `isArticleInStatus` read the class count. */
const classes = (count: number) =>
  Array.from({ length: count }, (_, i) => `c${i}`).join(' ')

const actionBar = `
  <div role="group" aria-label="actions">
    <div data-testid="reply"><div><svg></svg></div></div>
  </div>
`

// ponytail: edited variants differ only in links, which button making ignores
describe.each([
  {
    context: 'timeline',
    html: `<article data-testid="tweet" class="${classes(9)}">${actionBar}</article>`,
    path: '/birdman46049238',
  },
  {
    context: 'modal',
    html: `<div data-testid="tweet">${actionBar}</div>`,
    path: '/birdman46049238/status/1852311426666537322/video/1',
  },
  {
    context: 'status',
    html: `<article data-testid="tweet" class="${classes(6)}">${actionBar}</article>`,
    path: '/birdman46049238/status/1852311426666537322',
  },
])('unit test for Harvester in $context', ({ html, path }) => {
  const getArticle = () => screen.getAllByTestId('tweet')[0]

  beforeAll(() => {
    document.body.innerHTML = html
    setPath(path)
  })

  afterAll(() => {
    document.body.innerHTML = ''
    setPath('/')
  })

  it('can make harvest button', () => {
    // makeHarvestButton will calls `runtime.sendMessage` to check button status
    jest
      .spyOn(runtime, 'sendMessage')
      .mockResolvedValue({ status: 'ok', payload: { isExist: true } })

    const result = pipe(getArticle(), makeHarvestButton)()

    expect(isSuccessResult(result)).toBeTrue()

    const harvesterButton = screen.queryByTestId('harvester-button')
    expect(harvesterButton).toBeInTheDocument()
  })
})

it('should remove the identity and state of the sample button', () => {
  document.body.innerHTML = `
  <button id="base-ui-1" type="button" tabindex="0" class="btn"
    data-engagement-action="share" data-slot="xds-menu-trigger"
    aria-haspopup="menu" aria-expanded="true" aria-label="Share">
    <span data-popup-open=""><svg aria-hidden="true"></svg></span>
  </button>
  `
  const sample = document.querySelector<HTMLElement>('button')
  if (!sample) throw new Error('HTML is wrongly set')

  const button = bleachButton(sample)
  const attributesOf = (ele: Element) =>
    [ele, ...ele.querySelectorAll('*')].flatMap(e =>
      [...e.attributes].map(a => a.name)
    )

  expect(attributesOf(button).sort()).toEqual(['class', 'tabindex', 'type'])
  expect(button).toHaveAttribute('tabindex', '-1')
  expect(sample).toHaveAttribute('id', 'base-ui-1')
})
