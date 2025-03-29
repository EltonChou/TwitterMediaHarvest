import { SolutionQuota } from './solutionQuota'

describe('SolutionQuota', () => {
  it('should create a SolutionQuota instance', () => {
    const props = { quota: 10, resetTime: new Date(Date.now() + 10000) }
    const solutionQuota = SolutionQuota.create(props)
    expect(solutionQuota).toBeInstanceOf(SolutionQuota)
    expect(solutionQuota.remainingQuota).toBe(10)
    expect(solutionQuota.resetTime).toBeInstanceOf(Date)
  })

  it('should return the correct remaining quota', () => {
    const props = { quota: 5, resetTime: new Date(Date.now() + 10000) }
    const solutionQuota = SolutionQuota.create(props)
    expect(solutionQuota.remainingQuota).toBe(5)
  })

  it('should return true if the quota reset time has passed', () => {
    const props = { quota: 5, resetTime: new Date(Date.now() - 10000) }
    const solutionQuota = SolutionQuota.create(props)
    expect(solutionQuota.isReset).toBe(true)
  })

  it('should return false if the quota reset time has not passed', () => {
    const props = { quota: 5, resetTime: new Date(Date.now() + 10000) }
    const solutionQuota = SolutionQuota.create(props)
    expect(solutionQuota.isReset).toBe(false)
  })

  it('should return the correct reset time', () => {
    const resetTime = new Date(Date.now() + 10000)
    const props = { quota: 5, resetTime }
    const solutionQuota = SolutionQuota.create(props)
    expect(solutionQuota.resetTime).toBe(resetTime)
  })
})
