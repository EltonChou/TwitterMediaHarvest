// SPDX-License-Identifier: MPL-2.0
import DownloadInterrupted from '#domain/events/DownloadInterrupted'
import { MockEventPublisher } from '#mocks/eventPublisher'
import { MockDownloadRecordRepo } from '#mocks/repositories/downloadRecord'
import { cleanDownloadRecordOnReason } from './cleanDownloadRecordOnReason'

afterEach(() => jest.resetAllMocks())

describe('unit test for cleanDownloadRecordOnReason handler', () => {
  const publisher = new MockEventPublisher()

  it('removes the record when reason matches', async () => {
    const repo = new MockDownloadRecordRepo()
    const removeById = jest.spyOn(repo, 'removeById').mockResolvedValue()

    const handle = cleanDownloadRecordOnReason(repo, ['USER_CANCELED'])
    await handle(new DownloadInterrupted(1, 'USER_CANCELED'), publisher)

    expect(removeById).toHaveBeenCalledWith(1)
  })

  it('does nothing when reason is not in the list', async () => {
    const repo = new MockDownloadRecordRepo()
    const removeById = jest.spyOn(repo, 'removeById')

    const handle = cleanDownloadRecordOnReason(repo, ['USER_CANCELED'])
    await handle(new DownloadInterrupted(1, 'NETWORK_FAILED'), publisher)

    expect(removeById).not.toHaveBeenCalled()
  })
})
