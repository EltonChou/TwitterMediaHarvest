import {
  addStatisticsCount,
  getStatisticsCount,
} from '../helpers/storageHelper'

const statisticsKey = Object.freeze({
  successDownloadCount: 'successDownloadCount',
  failedDownloadCount: 'failedDownloadCount',
  errorCount: 'errorCount',
})

export default class Statistics {
  static async addSuccessDownloadCount() {
    await addStatisticsCount(statisticsKey.successDownloadCount)
  }

  static async addFailedDownloadCount() {
    await addStatisticsCount(statisticsKey.failedDownloadCount)
  }

  static async addErrorCount() {
    await addStatisticsCount(statisticsKey.errorCount)
  }

  static async getSuccessDownloadCount() {
    const count = await getStatisticsCount(statisticsKey.successDownloadCount)
    return count
  }
  static async getFailedDownloadCount() {
    const count = await getStatisticsCount(statisticsKey.failedDownloadCount)
    return count
  }

  static async getErrorCount() {
    const count = await getStatisticsCount(statisticsKey.errorCount)
    return count
  }
}
