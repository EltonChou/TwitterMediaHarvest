import { retrieveTweetsFromInstruction } from './tweet'
import fs from 'node:fs'
import path from 'node:path'

describe('unit test for tweet parser', () => {
  it.each([
    {
      responseName: 'UserMedia',
      tweetCount: 14,
    },
    { responseName: 'UserTweets', tweetCount: 20 },
    { responseName: 'TweetDetail', tweetCount: 8 },
  ])('should parse from $reponseName', ({ responseName, tweetCount }) => {
    const body = JSON.parse(
      fs
        .readFileSync(
          path.resolve(__dirname, 'test-data', `${responseName}.json`)
        )
        .toString()
    )

    const tweets = (body.instructions as XApi.Instruction[])
      .map(retrieveTweetsFromInstruction)
      .flat()

    expect(tweets.length).toBe(tweetCount)
  })
})
