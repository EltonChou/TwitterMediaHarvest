/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { ValueObject } from './base'

type UsageStatisticsProps = {
  downloadCount: number
  trafficUsage: number
}

export class UsageStatistics extends ValueObject<UsageStatisticsProps> {
  increase(delta: { downloadCount: number; trafficUsage: number }) {
    return new UsageStatistics({
      downloadCount: this.props.downloadCount + delta.downloadCount,
      trafficUsage: this.props.trafficUsage + delta.trafficUsage,
    })
  }

  isGreaterThan(that: UsageStatistics): boolean {
    return (
      this.props.downloadCount >= that.mapBy(props => props.downloadCount) &&
      this.props.trafficUsage >= that.mapBy(props => props.trafficUsage)
    )
  }

  isLessThan(that: UsageStatistics): boolean {
    return (
      this.props.downloadCount <= that.mapBy(props => props.downloadCount) &&
      this.props.trafficUsage <= that.mapBy(props => props.trafficUsage)
    )
  }
}
