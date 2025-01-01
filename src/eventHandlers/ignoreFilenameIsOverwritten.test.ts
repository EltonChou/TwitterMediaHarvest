import { MockEventPublisher } from '#mocks/eventPublisher'
import { MockWarningSettingsRepo } from '#mocks/repositories/warningSettings'
import { ignoreFilenameOverwritten } from './ignoreFilenameIsOverwritten'
// eslint-disable-next-line max-len
import { FilenameOverwrittenNotificationIgnoreButtonClicked } from '#domain/events/FilenameOverwrittenNotificationIgnoreButtonClicked'

it('can handle event', () => {
  const repo = new MockWarningSettingsRepo()
  const publisher = new MockEventPublisher()
  jest.spyOn(repo, 'save').mockImplementation(jest.fn())
  const handler = ignoreFilenameOverwritten(repo)

  handler(new FilenameOverwrittenNotificationIgnoreButtonClicked(), publisher)
})
