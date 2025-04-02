import { SolutionQuota } from '#domain/entities/solutionQuota'
import type { DomainEventHandler } from '#domain/eventPublisher'
import type { Notifier } from '#domain/notifier'
import type { ISolutionQuotaRepository } from '#domain/repositories/solutionQuota'
import { ResettableQuota } from '#domain/valueObjects/resettableQuota'
import { SolutionQuotaWarningNotificationConfig } from '#helpers/notificationConfig'
import { makeSolutionQuotaWarningId } from '#helpers/notificationId'
import type { Notifications } from 'webextension-polyfill'

const solutionId = 'native'

export const warnInsufficientNativeSolutionQuota =
  (
    solutionQuotaRepo: ISolutionQuotaRepository,
    notifier: Notifier<Notifications.CreateNotificationOptions>
  ): DomainEventHandler<DomainEventMap['tweetSolution:quota:insufficient']> =>
  async event => {
    let quota = await solutionQuotaRepo.get(solutionId)

    if (!quota) {
      quota = SolutionQuota.create(solutionId, {
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

    await quota.warnBy(async () => {
      try {
        await notifier.notify(
          makeSolutionQuotaWarningId(event.solutionId),
          SolutionQuotaWarningNotificationConfig.native({
            remainingQuota: event.remainingQuota,
            resetTime: event.resetTime,
          })
        )
        return undefined
      } catch (error) {
        console.error('Failed to send quota warning notification:', error)
        return error as Error
      }
    })

    await solutionQuotaRepo.save(quota)
  }
