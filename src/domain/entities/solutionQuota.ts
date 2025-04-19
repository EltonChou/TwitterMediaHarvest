/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import type { ResettableQuota } from '#domain/valueObjects/resettableQuota'
import { TimeHelper } from '#helpers/time'
import { Entity, EntityId } from './base'

interface QuotaProps extends LiteralObject {
  isRealtime: boolean
  quota: ResettableQuota
  warnedAt?: Date
}

export type SolutionId = string

const COOLDOWN = TimeHelper.minute(5)

export class SolutionQuotaId extends EntityId<SolutionId> {}

export class SolutionQuota extends Entity<SolutionQuotaId, QuotaProps> {
  get quota() {
    return this.props.quota
  }

  get isCooldown(): boolean {
    if (this.props.warnedAt)
      return Date.now() - this.props.warnedAt.getTime() < COOLDOWN

    return false
  }

  get warnedAt(): Date | undefined {
    return this.props.warnedAt
  }

  get isRealTime(): boolean {
    return this.props.isRealtime
  }

  static create(id: SolutionId, props: QuotaProps): SolutionQuota {
    return new SolutionQuota(new SolutionQuotaId(id), {
      ...props,
    })
  }

  async warnBy<TaskError extends Error>(
    invokeWarning: () => Promise<UnsafeTask<TaskError>>,
    warningOptions: WarningOptions = { force: false }
  ): Promise<UnsafeTask<TaskError>> {
    if (!warningOptions.force && this.isCooldown) return

    const error = await invokeWarning()
    if (!error) this.props = { ...this.props, warnedAt: new Date(Date.now()) }
    return error
  }

  updateQuota(quota: ResettableQuota) {
    this.props = { ...this.props, quota }
  }
}

type WarningOptions = { force?: boolean }
