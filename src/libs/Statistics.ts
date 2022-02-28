import {
  addStatisticsCount,
  getStatisticsCount,
} from '../helpers/storageHelper'

import { StatisticsKey } from '../typings'

export default class Statistics {
  static async addSuccessDownloadCount() {
    await addStatisticsCount(StatisticsKey.SuccessDownloadCount)
  }

  static async addFailedDownloadCount() {
    await addStatisticsCount(StatisticsKey.FailedDownloadCount)
  }

  static async addErrorCount() {
    await addStatisticsCount(StatisticsKey.ErrorCount)
  }

  static async getSuccessDownloadCount() {
    const count = await getStatisticsCount(StatisticsKey.SuccessDownloadCount)
    return count
  }
  static async getFailedDownloadCount() {
    const count = await getStatisticsCount(StatisticsKey.FailedDownloadCount)
    return count
  }

  static async getErrorCount() {
    const count = await getStatisticsCount(StatisticsKey.ErrorCount)
    return count
  }
}
