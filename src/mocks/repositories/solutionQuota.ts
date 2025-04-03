import type { SolutionId, SolutionQuota } from '#domain/entities/solutionQuota'
import type { ISolutionQuotaRepository } from '#domain/repositories/solutionQuota'

export class MockSolutionQuotaRepository implements ISolutionQuotaRepository {
  private storage = new Map<SolutionId, SolutionQuota>()

  async get(solutionId: SolutionId): Promise<SolutionQuota | undefined> {
    return this.storage.get(solutionId)
  }

  async save(solutionQuota: SolutionQuota): Promise<void> {
    this.storage.set(solutionQuota.id.value, solutionQuota)
  }

  async delete(solutionId: SolutionId): Promise<void> {
    this.storage.delete(solutionId)
  }

  // Helper method for testing
  clear(): void {
    this.storage.clear()
  }
}
