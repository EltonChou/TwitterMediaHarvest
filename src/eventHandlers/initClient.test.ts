import { Client, ClientUUID } from '#domain/entities/client'
import RuntimeInstalled from '#domain/events/RuntimeInstalled'
import { MockEventPublisher } from '#mocks/eventPublisher'
import { MockClientRepository } from '#mocks/repositories/client'
import { toErrorResult, toSuccessResult } from '#utils/result'
import { generateUsageStatistics } from '#utils/test/usageStatistics'
import { initClient } from './initClient'

describe('unit test for handler to initialize client', () => {
  it('can get client information and set uninstall url', async () => {
    const clientId = new ClientUUID(crypto.randomUUID())
    const client = new Client(clientId, {
      uninstallCode: 'code',
      syncedAt: Date.now(),
      syncToken: 'token',
      usageStatistics: generateUsageStatistics(),
    })

    const publisher = new MockEventPublisher()
    const repo = new MockClientRepository()

    const mockClientGet = jest
      .spyOn(repo, 'get')
      .mockResolvedValue(toSuccessResult(client))

    const setUninstallURL = jest.fn()

    await initClient(repo, setUninstallURL)(
      new RuntimeInstalled('5.0.0'),
      publisher
    )

    expect(mockClientGet).toHaveBeenCalled()
    expect(setUninstallURL).toHaveBeenCalledWith(client.uninstallUrl)
  })

  it('can handler error when failed to get client', async () => {
    const publisher = new MockEventPublisher()
    const repo = new MockClientRepository()

    const mockClientGet = jest
      .spyOn(repo, 'get')
      .mockResolvedValue(toErrorResult(new Error()))

    const setUninstallURL = jest.fn()

    await initClient(repo, setUninstallURL)(
      new RuntimeInstalled('5.0.0'),
      publisher
    )

    expect(mockClientGet).toHaveBeenCalled()
    expect(setUninstallURL).not.toHaveBeenCalled()
  })
})
