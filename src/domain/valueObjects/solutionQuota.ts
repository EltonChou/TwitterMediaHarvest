import { ValueObject } from './base'

interface QuotaProps extends LiteralObject {
  quota: number
  resetTime: Date
}

export class SolutionQuota extends ValueObject<QuotaProps> {
  constructor(props: QuotaProps) {
    super(props)
  }

  get remainingQuota(): number {
    return this.props.quota
  }

  get isReset(): boolean {
    return new Date() >= this.props.resetTime
  }

  get resetTime(): Date {
    return this.props.resetTime
  }

  static create(props: QuotaProps): SolutionQuota {
    return new SolutionQuota(props)
  }
}
