import type { ResettableQuota } from '#domain/valueObjects/resettableQuota'
import { TimeHelper } from '#helpers/time'
import { Entity, EntityId } from './base'

interface InitialProps {
  isRealtime: boolean
  quota: ResettableQuota
}

interface QuotaProps extends LiteralObject, InitialProps {
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

  static create(id: SolutionId, props: InitialProps): SolutionQuota {
    return new SolutionQuota(new SolutionQuotaId(id), {
      ...props,
    })
  }

  async warnBy<TaskError extends Error>(
    invokeWarning: () => Promise<UnsafeTask<TaskError>>
  ): Promise<UnsafeTask<TaskError>> {
    if (this.isCooldown) return

    const error = await invokeWarning()
    if (!error) this.props = { ...this.props, warnedAt: new Date(Date.now()) }
    return error
  }

  updateQuota(quota: ResettableQuota) {
    this.props = { ...this.props, quota }
  }
}
