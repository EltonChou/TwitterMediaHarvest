import { DomainEvent } from '#domain/events/base'

describe('unit test for domain event', () => {
  class TestEvent extends DomainEvent {
    name = 'testEvent'
  }

  it('can get occured time', () => {
    const event = new TestEvent()

    expect(Date.now() >= event.occuredAt.getTime()).toBeTruthy()
  })
})
