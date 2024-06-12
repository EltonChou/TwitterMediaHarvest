import type { V4Statistics } from '#schema'

export interface IUsageStatisticsUseCase {
  get(): Promise<V4Statistics>
  increase(statsDelta: V4Statistics): Promise<void>
  syncWithDownloadHistory(): Promise<void>
}
