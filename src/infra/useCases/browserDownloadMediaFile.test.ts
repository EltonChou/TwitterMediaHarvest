import BrowserDownloadDispatched from '#domain/events/BrowserDownloadDispatched'
import { DownloadTarget } from '#domain/valueObjects/downloadTarget'
import { TweetInfo } from '#domain/valueObjects/tweetInfo'
import { BrowserDownloadMediaFileUseCase } from './browserDownloadMediaFile'
import { faker } from '@faker-js/faker'
import { downloads } from 'webextension-polyfill'

const generateDownloadTarget = () =>
  new DownloadTarget({ filename: faker.system.fileName(), url: faker.internet.url() })

it('can download target file and emit browser download event', async () => {
  const mockDownload = jest.spyOn(downloads, 'download').mockResolvedValue(1)
  const tweetInfo = new TweetInfo({ screenName: 'someone', tweetId: '1145141919810' })
  const useCase = new BrowserDownloadMediaFileUseCase(tweetInfo, false)

  const targets = faker.helpers.multiple(generateDownloadTarget, {
    count: faker.number.int({ min: 1, max: 20 }),
  })

  await Promise.all(targets.map(target => useCase.process({ target })))

  expect(mockDownload).toHaveBeenCalledTimes(targets.length)
  expect(useCase.events.length).toBe(targets.length)
  expect(
    useCase.events.every(event => event instanceof BrowserDownloadDispatched)
  ).toBeTruthy()
})
