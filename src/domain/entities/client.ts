import type { UsageStatistics } from '#domain/valueObjects/usageStatistics'
import { TimeHelper } from '#helpers/time'
import { Entity, EntityId } from './base'

type ClientProps = {
  syncToken: string
  uninstallCode: string
  syncedAt: number

  usageStatistics: UsageStatistics
}

export class ClientUUID extends EntityId<string> {}

const SYNC_PERIOD: number =
  process.env.NODE_ENV === 'production' ? TimeHelper.minute(30) : TimeHelper.minute(10)

/**
 * syncing period is 30 minutes in prodcution, otherwise 10 minutes.
 */
export class Client extends Entity<ClientUUID, ClientProps> {
  get syncToken() {
    return this.props.syncToken
  }

  get uninstallCode() {
    return this.props.uninstallCode
  }

  get shouldSync(): boolean {
    return Date.now() - this.props.syncedAt >= SYNC_PERIOD
  }

  get usageStatistics() {
    return this.props.usageStatistics
  }

  updateSyncToken(token: string) {
    this.props.syncToken = token
  }
}
