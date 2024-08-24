import TweetFetchErrorNotificationClicked from '#domain/events/TweetFetchErrorNotificationClicked'
import { MockEventPublisher } from '#mocks/eventPublisher'
import { openFailedTweetInNewTab } from './openFailedTweetInNewTab'
import { tabs } from 'webextension-polyfill'

test('handler to open failed tweet in new tab', async () => {
  const mockCraeteTab = jest.spyOn(tabs, 'create')
  const event = new TweetFetchErrorNotificationClicked('123')

  await openFailedTweetInNewTab(event, new MockEventPublisher())
  expect(mockCraeteTab).toHaveBeenCalled()
})
