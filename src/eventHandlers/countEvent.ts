import { metrics } from '@sentry/browser'

export const countEvent = (metricName: string) => () => {
  if (__METRICS__) metrics.count(metricName, 1)
}
