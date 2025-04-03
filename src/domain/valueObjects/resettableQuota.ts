import { ValueObject } from './base'

interface ResettableQuotaProps extends LiteralObject {
  quota: number
  resetAt: Date
}

export class ResettableQuota extends ValueObject<ResettableQuotaProps> {
  get remaining(): number {
    return this.props.quota
  }

  get resetTime(): Date {
    return this.props.resetAt
  }

  get isReset(): boolean {
    return new Date(Date.now()) >= this.props.resetAt
  }
}
