import { DomainEvent } from './base'

export default class Aria2DownloadIsDispatched extends DomainEvent {
  constructor() {
    super('download:status:dispatched:aria2')
  }
}
