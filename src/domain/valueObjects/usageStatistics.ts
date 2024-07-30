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
