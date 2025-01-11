import { DownloadTarget } from '#domain/valueObjects/downloadTarget'
import { generateTweetInfo } from '#utils/test/tweetInfo'
import { Aria2DownloadMediaFile } from './aria2DownloadMediaFile'
import { runtime } from 'webextension-polyfill'

describe('unit test for aria2 donwload media file use case', () => {
  afterAll(() => {
    jest.resetAllMocks()
    jest.restoreAllMocks()
  })

  it('can dispatch download to aria2 extension', async () => {
    const mockSendMessage = jest
      .spyOn(runtime, 'sendMessage')
      .mockImplementationOnce(jest.fn())

    const tweetInfo = generateTweetInfo()
    const useCase = new Aria2DownloadMediaFile(tweetInfo)
    await useCase.process({
      target: new DownloadTarget({
        filename: 'filename',
        url: 'https://foo.bar',
      }),
    })

    expect(useCase.isOk).toBeTrue()
    expect(mockSendMessage).toHaveBeenCalledOnce()
  })
})
