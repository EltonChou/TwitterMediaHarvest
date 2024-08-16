import { ValueObject } from './base'
import type { V5PortableDownloadHistoryItem } from './portableDownloadHistoryItem'

export type V5PortableHistoryProps = {
  items: V5PortableDownloadHistoryItem[]
}

export class V5PortableHistory extends ValueObject<V5PortableHistoryProps> {
  toJSON() {
    return {
      version: '5.0.0',
      ...this.props,
    }
  }
}
