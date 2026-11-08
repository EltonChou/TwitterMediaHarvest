/**
 * @jest-environment jsdom
 */
import { TweetInfo } from '#domain/valueObjects/tweetInfo'
import {
  articleHasMedia,
  getLinksFromArticle,
  getScreenNameFromLink,
  getTweetIdFromLink,
  isArticleInStatus,
  isArticleInStream,
  isArticlePhotoMode,
  isMediaViewerOpenFor,
  isOwnByEmbedded,
  parseLinks,
  parseTweetInfo,
  selectArtcleMode,
} from './article'
import { isX } from './checker'
import { getAllByTestId } from '@testing-library/dom'
import 'core-js/actual/url/can-parse'
import * as E from 'fp-ts/Either'
import * as O from 'fp-ts/Option'
import { pipe } from 'fp-ts/lib/function'
import fs from 'fs/promises'
import sysPath from 'path'

jest.mock('./checker', () => ({
  ...jest.requireActual('./checker'),
  isX: jest.fn(() => false),
}))

const setPath = (path: string) => history.replaceState(null, '', path)
const setIsX = (value: boolean) =>
  (isX as jest.MockedFunction<typeof isX>).mockReturnValue(value)

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
    statusPath: '/birdman46049238/status/1852311426666537322',
    screenName: 'birdman46049238',
    tweetId: '1852311426666537322',
    mode: 'stream',
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
    statusPath: '/birdman46049238/status/1852311426666537322',
    screenName: 'birdman46049238',
    tweetId: '1852311426666537322',
    mode: 'photo',
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
    statusPath: '/birdman46049238/status/1852311426666537322',
    screenName: 'birdman46049238',
    tweetId: '1852311426666537322',
    mode: 'status',
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
    statusPath: '/seigura/status/1842037500065546723',
    screenName: 'seigura',
    tweetId: '1842037500065546723',
    mode: 'status',
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
    statusPath: '/seigura/status/1842037500065546723',
    screenName: 'seigura',
    tweetId: '1842037500065546723',
    mode: 'photo',
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
    statusPath: '/seigura/status/1842037500065546723',
    screenName: 'seigura',
    tweetId: '1842037500065546723',
    mode: 'stream',
  },
])(
  'unit test for Harvester in $context',
  ({ filePath, path, statusPath, screenName, tweetId, mode }) => {
    const getArticle = () => getAllByTestId(document.body, 'tweet')[0]

    beforeAll(async () => {
      const content = await fs.readFile(filePath, 'utf-8')
      document.body.innerHTML = content
      setPath(path)
    })

    it('can get tweet status link from article', async () => {
      const links = getLinksFromArticle(getArticle())
      expect(links).toContain(statusPath)
    })

    it.each([
      {
        parserTarget: 'screen name',
        parser: getScreenNameFromLink,
        expectedValue: screenName,
      },
      {
        parserTarget: 'tweet id',
        parser: getTweetIdFromLink,
        expectedValue: tweetId,
      },
    ])('can parse $parserTarget from links', ({ parser, expectedValue }) => {
      const links = getLinksFromArticle(getArticle())
      expect(
        pipe(
          links,
          parseLinks(parser),
          O.getOrElse(() => '')
        )
      ).toBe(expectedValue)
    })

    it('can parse tweet info from article', () => {
      const expectedTweetInfo = new TweetInfo({
        screenName: screenName,
        tweetId: tweetId,
      })
      const canParseTweetInfo = pipe(
        getArticle(),
        parseTweetInfo,
        E.match(
          () => false,
          info => expectedTweetInfo.is(info)
        )
      )

      expect(canParseTweetInfo).toBeTruthy()
    })

    it('can check article mode', async () => {
      const article = getArticle()
      expect(isArticleInStatus(article)).toBe(mode === 'status')
      expect(isArticleInStream(article)).toBe(mode === 'stream')
      expect(selectArtcleMode(article)).toBe(mode)
    })

    it('can check article has media', () => {
      expect(articleHasMedia(getArticle())).toBeTrue()
    })
  }
)

it('can check element is own by embedded tweet or not', () => {
  document.body.innerHTML = `
    <article id="main">
      <div data-slot="embedded-tweet-frame">
        <article id="quoted" />
      </div>
    </article>
  `

  const owner = document.getElementById('main')
  const ele = document.getElementById('quoted')

  if (!ele || !owner) throw new Error('HTML is wrongly set')
  expect(isOwnByEmbedded(owner)).toBeFalse()
  expect(isOwnByEmbedded(ele)).toBeTrue()
})

it.each([
  `
  <div aria-label="Media Viewer">
    <div>
      <a href="/someone/status/1/analytics"></a>
    </div>
    <div>
      <ul>
        <li>
          <div>
            <article id="target">
              <a href="/someone/status/1"></a>
            </article>
          </div>
        </li>
        <li>
          <div>
            <article>
              <a href="/someone/status/2"></a>
            </article>
          </div>
        </li>
      </ul>
    </div>
  </div>
  `,
  `
  <div aria-label="Media Viewer">
    <div>
      <a href="/someone/status/1/analytics"></a>
    </div>
    <div>
      <ul>
        <li>
          <div>
            <article>
              <a href="/someone/status/2"></a>
            </article>
          </div>
        </li>
        <li>
          <div>
            <article id="target">
              <a href="/someone/status/1"></a>
            </article>
          </div>
        </li>
      </ul>
    </div>
  </div>
  `,
])('can check media viewer is open for article or not', (html: string) => {
  document.body.innerHTML = html

  const targetArticle = document.getElementById('target')
  const anotherArticle =
    document.querySelector<HTMLElement>('article:not([id])')

  if (!targetArticle) throw new Error('HTML is wrongly set')
  if (!anotherArticle) throw new Error('HTML is wrongly set')

  expect(isMediaViewerOpenFor(targetArticle)).toBeTrue()
  expect(isMediaViewerOpenFor(anotherArticle)).toBeFalse()
})

it('should treat the media viewer bar container as photo mode in X', () => {
  const mockIsX = isX as jest.MockedFunction<typeof isX>
  mockIsX.mockReturnValue(true)
  document.body.innerHTML = `
  <div aria-label="Media Viewer">
    <div id="bar">
      <div role="group"><a href="/someone/status/1/analytics"></a></div>
    </div>
  </div>
  `

  const bar = document.getElementById('bar')
  if (!bar) throw new Error('HTML is wrongly set')

  expect(isArticlePhotoMode(bar)).toBeTrue()
  expect(getLinksFromArticle(bar)).toEqual(['/someone/status/1/analytics'])
  mockIsX.mockReturnValue(false)
})

it.each([
  { context: 'native video', link: '', expected: true },
  {
    context: 'link card video',
    link: '<a href="https://example.com" target="_blank"></a>',
    expected: false,
  },
])('should check $context has media', ({ link, expected }) => {
  setIsX(true)
  document.body.innerHTML = `
  <article>
    <a href="/someone/status/1"><time></time></a>
    <div><div><video></video></div>${link}</div>
  </article>
  `
  const article = document.querySelector('article')
  if (!article) throw new Error('HTML is wrongly set')

  expect(articleHasMedia(article)).toBe(expected)
  setIsX(false)
})

it('should get links from the analytics link of the article in media viewer thread', () => {
  const mockIsX = isX as jest.MockedFunction<typeof isX>
  mockIsX.mockReturnValue(true)
  document.body.innerHTML = `
  <div aria-label="Media Viewer">
    <div>
      <article id="target">
        <div>
          <article>
            <a href="/analytics_fan/status/2"></a>
            <a href="/analytics_fan/status/2/photo/1"></a>
          </article>
        </div>
        <a href="/someone/status/1"></a>
        <a href="/someone/status/1/analytics"></a>
      </article>
    </div>
  </div>
  `

  const article = document.getElementById('target')
  if (!article) throw new Error('HTML is wrongly set')

  expect(getLinksFromArticle(article)).toEqual(['/someone/status/1/analytics'])
  mockIsX.mockReturnValue(false)
})

it('should keep the video of a tweet quoting a card tweet', () => {
  setIsX(true)
  document.body.innerHTML = `
  <article id="target">
    <a href="/someone/status/1"><time></time></a>
    <video></video>
    <div>
      <article>
        <div><div></div><a href="https://example.com" target="_blank"></a></div>
      </article>
    </div>
  </article>
  `
  const article = document.getElementById('target')
  if (!article) throw new Error('HTML is wrongly set')

  expect(articleHasMedia(article)).toBeTrue()
  setIsX(false)
})

it('should not treat a card tweet with a photo link as having media', () => {
  setIsX(true)
  document.body.innerHTML = `
  <article id="target">
    <a href="/someone/status/1"><time></time></a>
    <div>
      <div><a href="/someone/status/1/photo/1"></a></div>
      <a href="https://example.com" target="_blank"></a>
    </div>
  </article>
  `
  const article = document.getElementById('target')
  if (!article) throw new Error('HTML is wrongly set')

  expect(articleHasMedia(article)).toBeFalse()
  setIsX(false)
})

describe('card detection in legacy frontend', () => {
  const hasMedia = (html: string) => {
    document.body.innerHTML = `<article id="target">${html}</article>`
    const article = document.getElementById('target')
    if (!article) throw new Error('HTML is wrongly set')
    return articleHasMedia(article)
  }

  it('should keep the video of a tweet quoting a card tweet', () => {
    expect(
      hasMedia(`
      <a href="/someone/status/1"><time></time></a>
      <video></video>
      <div role="link"><div data-testid="card.wrapper"></div></div>
      `)
    ).toBeTrue()
  })

  it('should ignore the video in a card', () => {
    expect(
      hasMedia(`
      <a href="/someone/status/1"><time></time></a>
      <div data-testid="card.wrapper"><video></video></div>
      `)
    ).toBeFalse()
  })

  it('should keep the video followed by an absolute link', () => {
    expect(
      hasMedia(`
      <a href="/someone/status/1"><time></time></a>
      <div><video></video></div>
      <a href="https://example.com" target="_blank"></a>
      `)
    ).toBeTrue()
  })
})
