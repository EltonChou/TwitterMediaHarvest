/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
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
        isRealtime: false, // Since we only need to record quota for non-realtime solutions
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
