import { TimeHelper } from '#helpers/time'

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
})
