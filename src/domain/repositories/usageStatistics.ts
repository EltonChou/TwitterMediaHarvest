/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { UsageStatistics } from '#domain/valueObjects/usageStatistics'

export interface IUsageStatisticsRepository {
  get(): Promise<UsageStatistics>
  save(stats: UsageStatistics): Promise<void>
}
