import type { DomainEventHandler } from '#domain/eventPublisher'
import { metrics } from '@sentry/browser'

const normalizeEventName = (eventName: string): string =>
  eventName.replace(/:/g, '.')

export const countEvent =
  (metricName?: string): DomainEventHandler<IDomainEvent> =>
  e => {
    if (__METRICS__)
      if (metricName !== undefined && metricName !== '')
        metrics.count(metricName, 1)
      else
        metrics.count(normalizeEventName(e.name), 1, {
          attributes: { event: { type: 'domain' } },
        })
  }
