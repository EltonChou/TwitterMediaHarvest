import { ValueObject } from './base'
import {
  V5PortableDownloadHistoryItem,
  type V5PortableDownloadHistoryItemProps,
} from './portableDownloadHistoryItem'

export type V5PortableHistoryProps = {
  items: V5PortableDownloadHistoryItem[]
}

export type V5JsonSchema = {
  version: '5.0.0'
  items: V5PortableDownloadHistoryItemProps[]
}

export class V5PortableHistory extends ValueObject<V5PortableHistoryProps> {
  toJSON() {
    return {
      version: '5.0.0',
      items: this.props.items,
    }
  }

  static fromJSON(json: V5JsonSchema) {
    return new V5PortableHistory({
      items: json.items.map(props => new V5PortableDownloadHistoryItem(props)),
    })
  }
}
