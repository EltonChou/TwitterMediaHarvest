/**
 * @jest-environment jsdom
 */
import { chrome } from 'jest-chrome'

import {
  createElementFromHTML,
  makeButtonListener,
  makeButtonWithData,
  makeDownloadRecordId
} from '../../utils/maker'

import {
  TweetInfo
} from '../../typings'

test('create element from HTML string', () => {
  const button = createElementFromHTML('<button><span>yolo</span></button>')
  expect(button.tagName).toBe('button'.toUpperCase())
})

test('append tweet info data to html element', () => {
  const tweetInfo: TweetInfo = {
    screenName: 'user',
    tweetId: '123123'
  }
  const button = document.createElement('button')
  const buttonWithData = makeButtonWithData(button, tweetInfo)

  expect(buttonWithData.dataset.screenName).toBe(tweetInfo.screenName)
  expect(buttonWithData.dataset.tweetId).toBe(tweetInfo.tweetId)
})

test('add listener to html element', () => {
  const button = document.createElement('button')
  chrome.runtime.sendMessage.mockImplementation((message, callback) => {
    callback('a')
  })

  makeButtonListener(button)
})

test('make DownloadRecordId', () => {
  expect(makeDownloadRecordId(123)).toBe('dl_123')
})