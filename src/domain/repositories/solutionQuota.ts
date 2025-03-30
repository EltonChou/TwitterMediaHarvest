import type { SolutionId, SolutionQuota } from '#domain/entities/solutionQuota'

export interface ISolutionQuotaRepository {
  get(solutionId: SolutionId): Promise<SolutionQuota | null>
  save(solutionQuota: SolutionQuota): Promise<void>
  delete(solutionId: SolutionId): Promise<void>
}
