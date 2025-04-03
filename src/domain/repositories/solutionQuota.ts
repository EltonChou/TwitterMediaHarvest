import type { SolutionId, SolutionQuota } from '#domain/entities/solutionQuota'

export interface ISolutionQuotaRepository {
  get(solutionId: SolutionId): Promise<SolutionQuota | undefined>
  save(solutionQuota: SolutionQuota): Promise<void>
}
