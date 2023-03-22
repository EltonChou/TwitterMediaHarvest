/**
 * @jest-environment jsdom
 */
import { chrome } from 'jest-chrome'

import {
  createElementFromHTML,
  makeButtonWithData,

} from '../../content_script/utils/maker'
import { DownloadRecordIdHelper } from '../../backend/downloadRecords/helpers'


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


describe('Test DownloadRecordUtil', () => {
  it('can valid DownloadRecord id', () => {
    expect(DownloadRecordIdHelper.validId('dl_384')).toBeTruthy()
    expect(DownloadRecordIdHelper.validId('384')).toBeFalsy()
  })

  it('can extract DownloadItemId from DownloadRecord id', () => {
    expect(DownloadRecordIdHelper.toDownloadItemId('dl_123')).toBe(123)
  })
})