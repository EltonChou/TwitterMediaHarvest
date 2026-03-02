import { DomainEvent } from '#domain/events/base'
import { MockEventPublisher } from '#mocks/eventPublisher'
import { countEvent } from './countEvent'
import { metrics } from '@sentry/browser'

describe('countEvent', () => {
  class DummyDomainEvent extends DomainEvent {
    constructor() {
      super('dummy:domain:event' as DomainEvent['name'])
    }
  }

  const eventPublisher = new MockEventPublisher()

  beforeAll(() => {
    Object.assign(global, { __METRICS__: true })
  })

  afterAll(() => {
    Object.assign(global, { __METRICS__: false })
  })

  it('can count event', async () => {
    const mockMetricCount = jest.fn()
    jest.spyOn(metrics, 'count').mockImplementationOnce(mockMetricCount)

    countEvent('dummy')(new DummyDomainEvent(), eventPublisher)

    expect(mockMetricCount).toHaveBeenCalledOnce()
    expect(mockMetricCount).toHaveBeenCalledWith('dummy', 1)
  })

  it('can count event with normalized domain event name when no metric name provided', async () => {
    const mockMetricCount = jest.fn()
    jest.spyOn(metrics, 'count').mockImplementationOnce(mockMetricCount)

    countEvent()(new DummyDomainEvent(), eventPublisher)

    expect(mockMetricCount).toHaveBeenCalledOnce()
    expect(mockMetricCount).toHaveBeenCalledWith('dummy.domain.event', 1, {
      attributes: { event: { type: 'domain' } },
    })
  })
})
