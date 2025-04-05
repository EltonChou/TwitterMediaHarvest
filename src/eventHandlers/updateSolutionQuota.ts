import { SolutionQuota } from '#domain/entities/solutionQuota'
import type { DomainEventHandler } from '#domain/eventPublisher'
import type { ISolutionQuotaRepository } from '#domain/repositories/solutionQuota'
import { ResettableQuota } from '#domain/valueObjects/resettableQuota'

export const updateSolutionQuota =
  (
    solutionQuotaRepo: ISolutionQuotaRepository
  ): DomainEventHandler<DomainEventMap['tweetSolution:quota:changed']> =>
  async event => {
    let quota = await solutionQuotaRepo.get(event.solutionId)

    if (!quota) {
      quota = SolutionQuota.create(event.solutionId, {
        isRealtime: true,
        quota: new ResettableQuota({
          quota: event.remainingQuota,
          resetAt: event.resetTime,
        }),
      })
    } else {
      quota.updateQuota(
        new ResettableQuota({
          quota: event.remainingQuota,
          resetAt: event.resetTime,
        })
      )
    }

    await solutionQuotaRepo.save(quota)
  }
