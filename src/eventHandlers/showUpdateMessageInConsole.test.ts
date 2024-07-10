import RuntimeUpdated from '#domain/events/RuntimeUpdated'
import { showUpdateMessageInConsole } from './showUpdateMessageInConsole'

test('handler to show update message in console', () => {
  const mockLog = jest.spyOn(console, 'info').mockImplementation(jest.fn())
  showUpdateMessageInConsole(new RuntimeUpdated({ current: '2.0.0', previous: '1.0.0' }))
  expect(mockLog).toHaveBeenCalled()
  mockLog.mockClear()
})
