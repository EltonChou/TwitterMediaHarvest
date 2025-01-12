import ClientWasSynced from '#domain/events/ClientWasSynced'
import { MockEventPublisher } from '#mocks/eventPublisher'
import { MockClientRepository } from '#mocks/repositories/client'
import { setUser } from '#monitor'
import { toSuccessResult } from '#utils/result'
import { generateClient } from '#utils/test/client'
import { setMonitorUser } from './setMonitorUser'

jest.mock('#monitor', () => ({
  ...jest.requireActual('#monitor'),
  setUser: jest.fn(),
}))

describe('unit test for handler to set monitor user', () => {
  it('can set user', async () => {
    const publisher = new MockEventPublisher()
    const clientRepo = new MockClientRepository()
    jest
      .spyOn(clientRepo, 'get')
      .mockResolvedValueOnce(toSuccessResult(generateClient()))

    const handler = setMonitorUser(clientRepo)
    await handler(new ClientWasSynced(), publisher)
    expect(setUser).toHaveBeenCalledOnce()
  })
})
