import { DomainEvent } from './base'

export default class NativeTweetSolutionQuotaInsufficient
  extends DomainEvent
  implements QuotaEvent
{
  constructor(
    readonly remainingQuota: number,
    readonly resetTime: Date
  ) {
    super('tweetSolution:native:quota:insufficient')
  }
}
