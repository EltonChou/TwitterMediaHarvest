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
  parseLinks,
  parseTweetInfo,
  selectArtcleMode,
} from './article'
import { getAllByTestId } from '@testing-library/dom'
import 'core-js/actual/url/can-parse'
import * as E from 'fp-ts/Either'
import * as O from 'fp-ts/Option'
import { pipe } from 'fp-ts/lib/function'
import fs from 'fs/promises'
import sysPath from 'path'

const setPath = (path: string) =>
  Object.defineProperty(window, 'location', {
    value: { pathname: path },
    writable: true,
  })

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
