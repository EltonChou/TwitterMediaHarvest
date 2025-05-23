/**
 * @file This file is auto-generated.
 * @generated by Copilot \w Claude 3.5 Sonnet
 */
import { ResettableQuota } from '#domain/valueObjects/resettableQuota'
import { SolutionQuota } from './solutionQuota'

describe('SolutionQuota', () => {
  it('should create a SolutionQuota instance', () => {
    const quota = new ResettableQuota({
      quota: 10,
      resetAt: new Date(Date.now() + 10000),
    })
    const props = {
      quota,
      isRealtime: false,
    }
    const solutionQuota = SolutionQuota.create('native', props)
    expect(solutionQuota).toBeInstanceOf(SolutionQuota)
    expect(solutionQuota.quota.remaining).toBe(10)
    expect(solutionQuota.quota.resetTime).toBeInstanceOf(Date)
  })

  it('should return the correct remaining quota', () => {
    const quota = new ResettableQuota({
      quota: 5,
      resetAt: new Date(Date.now() + 10000),
    })
    const props = {
      quota,
      isRealtime: false,
    }
    const solutionQuota = SolutionQuota.create('native', props)
    expect(solutionQuota.quota.remaining).toBe(5)
  })

  it('should return true if the quota reset time has passed', () => {
    const quota = new ResettableQuota({
      quota: 5,
      resetAt: new Date(Date.now()),
    })
    const props = {
      quota,
      isRealtime: false,
    }
    const solutionQuota = SolutionQuota.create('native', props)
    expect(solutionQuota.quota.isReset).toBe(true)
  })

  it('should return false if the quota reset time has not passed', () => {
    const quota = new ResettableQuota({
      quota: 5,
      resetAt: new Date(Date.now() + 10000),
    })
    const props = {
      quota,
      isRealtime: false,
    }
    const solutionQuota = SolutionQuota.create('native', props)
    expect(solutionQuota.quota.isReset).toBe(false)
  })

  it('should return true if the quota is realtime', () => {
    const quota = new ResettableQuota({
      quota: 10,
      resetAt: new Date(Date.now() + 10000),
    })
    const props = {
      quota,
      isRealtime: true,
    }
    const solutionQuota = SolutionQuota.create('native', props)
    expect(solutionQuota.isRealTime).toBeTrue()
  })

  it('should return false if the quota is not realtime', () => {
    const quota = new ResettableQuota({
      quota: 10,
      resetAt: new Date(Date.now() + 10000),
    })
    const props = {
      quota,
      isRealtime: false,
    }
    const solutionQuota = SolutionQuota.create('native', props)
    expect(solutionQuota.isRealTime).toBeFalse()
  })

  it('should return the correct reset time', () => {
    const resetTime = new Date(Date.now() + 10000)
    const quota = new ResettableQuota({ quota: 5, resetAt: resetTime })
    const props = { quota, isRealtime: false }
    const solutionQuota = SolutionQuota.create('native', props)
    expect(solutionQuota.quota.resetTime).toBe(resetTime)
  })

  it('should invoke warning and update warning time', async () => {
    const mockWarn = jest.fn<Promise<UnsafeTask>, []>()
    const resetTime = new Date(Date.now() + 10000)
    const quota = new ResettableQuota({ quota: 5, resetAt: resetTime })
    const props = { quota, isRealtime: false }
    const solutionQuota = SolutionQuota.create('native', props)

    expect(solutionQuota.isCooldown).toBeFalse()

    const error = await solutionQuota.warnBy(mockWarn)
    // This should not be invoked, because the warning is cooling down.
    await solutionQuota.warnBy(mockWarn)

    expect(mockWarn).toHaveBeenCalledOnce()
    expect(error).toBeUndefined()
    expect(solutionQuota.isCooldown).toBeTrue()
    expect(solutionQuota.warnedAt).toBeDefined()
    expect(new Date() >= (solutionQuota.warnedAt as Date)).toBeTrue()
    expect(solutionQuota.isCooldown).toBeTrue()
  })

  it('should forcely invoke warning and update warning time', async () => {
    const mockWarn = jest.fn<Promise<UnsafeTask>, []>()
    const resetTime = new Date(Date.now() + 10000)
    const quota = new ResettableQuota({ quota: 5, resetAt: resetTime })
    const props = {
      quota,
      isRealtime: false,
      warnedAt: new Date(Date.now() - 100),
    }
    const solutionQuota = SolutionQuota.create('native', props)

    expect(solutionQuota.isCooldown).toBeTrue()

    const error = await solutionQuota.warnBy(mockWarn, { force: true })
    // This should not be invoked, because the warning is cooling down.
    await solutionQuota.warnBy(mockWarn)

    expect(mockWarn).toHaveBeenCalledOnce()
    expect(error).toBeUndefined()
    expect(solutionQuota.isCooldown).toBeTrue()
    expect(solutionQuota.warnedAt).toBeDefined()
    expect(new Date() >= (solutionQuota.warnedAt as Date)).toBeTrue()
    expect(solutionQuota.isCooldown).toBeTrue()
  })

  it('should update quota information', async () => {
    const resetTime = new Date(Date.now() + 10000)
    const quota = new ResettableQuota({ quota: 5, resetAt: resetTime })
    const props = { quota, isRealtime: false }
    const solutionQuota = SolutionQuota.create('native', props)

    const newQuota = new ResettableQuota({
      quota: 114,
      resetAt: new Date(2222),
    })
    solutionQuota.updateQuota(newQuota)

    expect(solutionQuota.quota.is(newQuota)).toBeTrue()
  })
})
