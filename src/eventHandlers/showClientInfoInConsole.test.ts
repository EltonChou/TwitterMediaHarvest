import RuntimeUpdated from '#domain/events/RuntimeUpdated'
import { MockEventPublisher } from '#mocks/eventPublisher'
import { MockClientRepository } from '#mocks/repositories/client'
import { toSuccessResult } from '#utils/result'
import { generateClient } from '#utils/test/client'
import { showClientInfoInConsole } from './showClientInfoInConsole'

test('handler to show client information in console', async () => {
  const mockLog = jest.spyOn(console, 'info').mockImplementation(jest.fn())
  const clientRepo = new MockClientRepository()
  jest
    .spyOn(clientRepo, 'get')
    .mockResolvedValueOnce(toSuccessResult(generateClient()))

  await showClientInfoInConsole(clientRepo)(
    new RuntimeUpdated({ current: '2.0.0', previous: '1.0.0' }),
    new MockEventPublisher()
  )

  expect(mockLog).toHaveBeenCalledTimes(1)

  jest.resetAllMocks()
  jest.restoreAllMocks()
})
