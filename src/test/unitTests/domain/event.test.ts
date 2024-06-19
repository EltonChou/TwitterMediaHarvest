import { DomainEvent } from '#domain/events/base'

describe('unit test for domain event', () => {
  class TestEvent extends DomainEvent {}

  it('can get occured time', () => {
    const event = new TestEvent('filename:overwritten')

    expect(Date.now() >= event.occuredAt.getTime()).toBeTruthy()
  })
})
