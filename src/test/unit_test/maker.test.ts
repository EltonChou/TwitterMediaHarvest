/**
 * @jest-environment jsdom
 */
import { chrome } from 'jest-chrome'

import {
  createElementFromHTML,
  makeButtonListener,
  makeButtonWithData,

} from '../../content_script/utils/maker'
import DownloadRecordUtil from '../../backend/utils/DownloadRecordUtil'


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


describe('Test DownloadRecordUtil', () => {
  it('can make DownloadRecordId', () => {
    expect(DownloadRecordUtil.createId(123)).toBe('dl_123')
  })

  it('can valid DownloadRecord id', () => {
    expect(DownloadRecordUtil.isValidId('dl_384')).toBeTruthy()
    expect(DownloadRecordUtil.isValidId('384')).toBeFalsy()
  })

  it('can extract DownloadItemId from DownloadRecord id', () => {
    expect(DownloadRecordUtil.extractDownloadItemId('dl_123')).toBe(123)
  })
})