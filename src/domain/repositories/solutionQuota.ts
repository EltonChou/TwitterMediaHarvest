import type { SolutionQuota } from '../valueObjects/solutionQuota'

export interface ISolutionQuotaRepository {
  get(): Promise<SolutionQuota | null>
  save(solutionQuota: SolutionQuota): Promise<void>
  delete(): Promise<void>
}
