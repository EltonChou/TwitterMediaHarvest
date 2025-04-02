import { DomainEvent } from './base'

export default class TweetSolutionQuotaChanged
  extends DomainEvent
  implements QuotaEvent
{
  constructor(
    readonly solutionId: string,
    readonly remainingQuota: number,
    readonly resetTime: Date
  ) {
    super('tweetSolution:quota:changed')
  }
}
