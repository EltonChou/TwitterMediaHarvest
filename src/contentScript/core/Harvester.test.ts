/**
 * @jest-environment jsdom
 */
import { makeHarvestButton } from './Harvester'
import { screen } from '@testing-library/dom'
import * as IOE from 'fp-ts/lib/IOEither'
import { pipe } from 'fp-ts/lib/function'
import fs from 'fs/promises'
import sysPath from 'path'
import { runtime } from 'webextension-polyfill'

const setPath = (path: string) =>
  Object.defineProperty(window, 'location', {
    value: { pathname: path },
    writable: true,
  })

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

describe.each([
  {
    context: 'timeline',
    filePath: sysPath.resolve(
      __dirname,
      '..',
      'testCases',
      'tweet',
      'timeline.html'
    ),
    path: '/birdman46049238',
  },
  {
    context: 'modal',
    filePath: sysPath.resolve(
      __dirname,
      '..',
      'testCases',
      'tweet',
      'modal.html'
    ),
    path: '/birdman46049238/status/1852311426666537322/video/1',
  },
  {
    context: 'status',
    filePath: sysPath.resolve(
      __dirname,
      '..',
      'testCases',
      'tweet',
      'status.html'
    ),
    path: '/birdman46049238/status/1852311426666537322',
  },
  {
    context: 'edited-status',
    filePath: sysPath.resolve(
      __dirname,
      '..',
      'testCases',
      'tweet',
      'edited-status.html'
    ),
    path: '/seigura/status/1842037500065546723',
  },
  {
    context: 'edited-modal',
    filePath: sysPath.resolve(
      __dirname,
      '..',
      'testCases',
      'tweet',
      'edited-modal.html'
    ),
    path: '/seigura/status/1842037500065546723/photo/3',
  },
  {
    context: 'edited-timeline',
    filePath: sysPath.resolve(
      __dirname,
      '..',
      'testCases',
      'tweet',

      'edited-timeline.html'
    ),
    path: '/seigura',
  },
])('unit test for Harvester', ({ filePath, path, context }) => {
  const getArticle = () => screen.getAllByTestId('tweet')[0]

  beforeAll(async () => {
    const content = await fs.readFile(filePath, 'utf-8')
    document.body.innerHTML = content
    setPath(path)
  })

  afterAll(async () => {
    document.body.innerHTML = ''
    setPath('/')
  })

  it(`can make harvest button ion context: ${context}`, () => {
    // makeHarvestButton will calls `runtime.sendMessage` to check button status
    jest
      .spyOn(runtime, 'sendMessage')
      .mockResolvedValue({ status: 'ok', payload: { isExist: true } })

    const result = pipe(
      getArticle(),
      makeHarvestButton,
      IOE.match(
        () => 'bad',
        () => 'ok'
      )
    )()

    expect(result).toBe('ok')

    const harvesterButton = screen.queryByTestId('harvester-button')
    expect(harvesterButton).toBeInTheDocument()
  })
})
