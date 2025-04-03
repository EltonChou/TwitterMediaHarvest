import { DomainEvent } from '#domain/events/base'
import { MockEventPublisher } from '#mocks/eventPublisher'
import { logEventInConsole } from './logEventInConsole'

describe('logEventInConsole', () => {
  let consoleGroupSpy: jest.SpyInstance
  let consoleInfoSpy: jest.SpyInstance
  let consoleDirSpy: jest.SpyInstance
  let consoleGroupEndSpy: jest.SpyInstance

  class TestEvent extends DomainEvent {
    constructor() {
      super('client:synced')
    }
  }

  beforeEach(() => {
    consoleGroupSpy = jest.spyOn(console, 'group')
    consoleInfoSpy = jest.spyOn(console, 'info')
    consoleDirSpy = jest.spyOn(console, 'dir')
    consoleGroupEndSpy = jest.spyOn(console, 'groupEnd')
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  it('should log event details to console', async () => {
    const event = new TestEvent()
    await logEventInConsole(new TestEvent(), new MockEventPublisher())

    expect(consoleGroupSpy).toHaveBeenCalledWith('Event received')
    expect(consoleInfoSpy).toHaveBeenCalledWith('Event name:', event.name)
    expect(consoleDirSpy).toHaveBeenCalledWith(event, {
      depth: null,
      colors: true,
    })
    expect(consoleGroupEndSpy).toHaveBeenCalled()
  })
})
