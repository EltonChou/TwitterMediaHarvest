import type { V4Statistics } from '#schema'

export type StatsDelta = V4Statistics

export const increaseStats =
  (delta: StatsDelta) =>
  (stats: V4Statistics): V4Statistics => {
    return {
      downloadCount: stats.downloadCount + Math.max(delta.downloadCount, 0),
      trafficUsage: stats.trafficUsage + Math.max(delta.trafficUsage, 0),
    }
  }
