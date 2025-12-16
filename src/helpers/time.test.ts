import { TimeHelper, setDuration } from '#helpers/time'

describe('TimeHelper unit test', () => {
  it('can make second', () => {
    expect(TimeHelper.second(50)).toEqual(50 * 1000)
  })

  it('can make minute', () => {
    expect(TimeHelper.minute(2)).toEqual(2 * 60 * 1000)
  })

  it('can make hour', () => {
    expect(TimeHelper.hour(40)).toEqual(40 * 60 * 60 * 1000)
  })

  it('can make day', () => {
    expect(TimeHelper.day(14)).toEqual(14 * 24 * 60 * 60 * 1000)
  })

  it('can calculate duration between two dates', () => {
    const from = new Date('2025-01-01T00:00:00Z')
    const to = new Date('2025-01-01T00:01:00Z')
    expect(TimeHelper.duration(from, to)).toEqual(60 * 1000)
  })

  it('can calculate duration between timestamps', () => {
    const from = 1000
    const to = 4000
    expect(TimeHelper.duration(from, to)).toEqual(3000)
  })

  it('can calculate duration from date to now', () => {
    const from = new Date(Date.now() - 5000)
    const duration = TimeHelper.duration(from)
    expect(duration).toBeGreaterThanOrEqual(5000)
    expect(duration).toBeLessThan(5100)
  })

  it('can measure elapsed time after delay', () => {
    jest.useFakeTimers()
    const timer = setDuration()
    setTimeout(() => {}, 50)
    jest.advanceTimersByTime(50)
    const elapsed = timer.end()
    expect(elapsed).toBeGreaterThanOrEqual(50)
    expect(elapsed).toBeLessThan(150)
    jest.useRealTimers()
  })
})
