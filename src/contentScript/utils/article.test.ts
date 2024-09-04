/**
 * @jest-environment jsdom
 */
import { TweetInfo } from '#domain/valueObjects/tweetInfo'
import {
  getLinksFromArticle,
  getScreenNameFromLink,
  getTweetIdFromLink,
  parseLinks,
  parseTweetInfo,
} from './article'
import * as E from 'fp-ts/Either'
import * as O from 'fp-ts/Option'
import { pipe } from 'fp-ts/lib/function'
import fs from 'fs/promises'
import path from 'path'

describe.each([
  {
    context: 'timeline',
    filePath: path.resolve(__dirname, 'testCases', 'twitter', 'timeline.html'),
  },
  {
    context: 'modal',
    filePath: path.resolve(__dirname, 'testCases', 'twitter', 'modal.html'),
  },
  {
    context: 'status',
    filePath: path.resolve(__dirname, 'testCases', 'twitter', 'status.html'),
  },
])('unit test for Harvester in $context', ({ filePath }) => {
  const getArticle = () => {
    const article = document.querySelector('article')
    if (!article) throw new Error('article is not found.')
    return article
  }

  beforeAll(async () => {
    const content = await fs.readFile(filePath, 'utf-8')
    document.body.innerHTML = content
  })

  it('can get tweet status link from article', async () => {
    const links = getLinksFromArticle(getArticle())
    expect(links).toContain('/birdman46049238/status/1619293234035032065')
  })

  it.each([
    {
      parserTarget: 'screen name',
      parser: getScreenNameFromLink,
      expectedValue: 'birdman46049238',
    },
    {
      parserTarget: 'tweet id',
      parser: getTweetIdFromLink,
      expectedValue: '1619293234035032065',
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
      screenName: 'birdman46049238',
      tweetId: '1619293234035032065',
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
})
