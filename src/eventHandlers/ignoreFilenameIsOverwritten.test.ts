import { FilenameOverwrittenNotificationIgnoreButtonClicked } from '#domain/events/FilenameOverwrittenNotificationIgnoreButtonClicked'
import { MockEventPublisher } from '#mocks/eventPublisher'
import { MockWarningSettingsRepo } from '#mocks/repositories/warningSettings'
import { ignoreFilenameOverwritten } from './ignoreFilenameIsOverwritten'

it('can handle event', () => {
  const repo = new MockWarningSettingsRepo()
  const publisher = new MockEventPublisher()
  jest.spyOn(repo, 'save').mockImplementation(jest.fn())
  const handler = ignoreFilenameOverwritten(repo)

  handler(new FilenameOverwrittenNotificationIgnoreButtonClicked(), publisher)
})
