import { countEvent } from './countEvent'
import { metrics } from '@sentry/browser'

describe('countEvent', () => {
  beforeAll(() => {
    Object.assign(global, { __METRICS__: true })
  })

  afterAll(() => {
    Object.assign(global, { __METRICS__: false })
  })

  it('can count event', async () => {
    const mockMetricCount = jest.fn()
    jest.spyOn(metrics, 'count').mockImplementationOnce(mockMetricCount)

    countEvent('dummy')()

    expect(mockMetricCount).toHaveBeenCalledOnce()
    expect(mockMetricCount).toHaveBeenCalledWith('dummy', 1)
  })
})
