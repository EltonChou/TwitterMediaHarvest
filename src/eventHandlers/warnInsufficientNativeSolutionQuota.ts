/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import type { DomainEventHandler } from '#domain/eventPublisher'
import type { Notifier } from '#domain/notifier'
import type { ISolutionQuotaRepository } from '#domain/repositories/solutionQuota'
import { SolutionQuotaWarningNotificationConfig } from '#helpers/notificationConfig'
import { makeSolutionQuotaWarningId } from '#helpers/notificationId'
import type { Notifications } from 'webextension-polyfill'

export const warnInsufficientNativeSolutionQuota =
  (
    solutionQuotaRepo: ISolutionQuotaRepository,
    notifier: Notifier<Notifications.CreateNotificationOptions>
  ): DomainEventHandler<DomainEventMap['tweetSolution:quota:insufficient']> =>
  async event => {
    const notify = (options: { requireInteraction: boolean }) => async () => {
      notifier.notify(
        makeSolutionQuotaWarningId(event.solutionId),
        SolutionQuotaWarningNotificationConfig.native({
          remainingQuota: event.remainingQuota,
          resetTime: event.resetTime,
          requireInteraction: options.requireInteraction,
        })
      )
    }

    // If the remaining quota is 0, notify immediately for better user experience
    // and to avoid waiting for the next warning notification
    if (event.remainingQuota === 0) await notify({ requireInteraction: true })()

    if (event.remainingQuota > 0) {
      const quota = await solutionQuotaRepo.get(event.solutionId)
      if (!quota) return

      // TODO: Need users' feedback to decide the frequency of warning notifications
      const error = await quota.warnBy(notify({ requireInteraction: false }))
      if (error)
        // eslint-disable-next-line no-console
        console.error('Failed to send quota warning notification.', error)
      await solutionQuotaRepo.save(quota)
    }
  }
