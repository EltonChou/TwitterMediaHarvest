import { V4Statistics } from '#schema'

export interface IUsageStatisticsRepository {
  get(): Promise<V4Statistics>
  save(stats: V4Statistics): Promise<void>
}
