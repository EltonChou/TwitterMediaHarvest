import type { V4Statistics } from '#schema'

export interface IUsageStatisticsUseCase {
  increase(statsDelta: V4Statistics): Promise<void>
}
