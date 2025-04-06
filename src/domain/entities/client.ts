/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import ClientWasSynced from '#domain/events/ClientWasSynced'
import type { UsageStatistics } from '#domain/valueObjects/usageStatistics'
import { makeApiUrl } from '#helpers/clientApiUrl'
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
  process.env.NODE_ENV === 'production'
    ? TimeHelper.minute(30)
    : TimeHelper.minute(10)

export class Client
  extends Entity<ClientUUID, ClientProps>
  implements DomainEventSource
{
  readonly events: IDomainEvent[]

  constructor(id: ClientUUID, props: ClientProps) {
    super(id, props)
    this.events = []
  }

  get syncToken() {
    return this.props.syncToken
  }

  get uninstallUrl() {
    return makeApiUrl('/v1/clients/' + this.id.value + '/uninstall', {
      uninstallCode: this.props.uninstallCode,
    }).href
  }

  /**
   * syncing period is *30 minutes* in prodcution, otherwise *10 minutes*.
   */
  get shouldSync(): boolean {
    return Date.now() - this.props.syncedAt >= SYNC_PERIOD
  }

  get usageStatistics() {
    return this.props.usageStatistics
  }

  /**
   * Every time we sync the client, we will get a new sync token.
   */
  updateSyncToken(token: string) {
    this.props = {
      ...this.props,
      syncedAt: Date.now(),
      syncToken: token,
    }
    this.events.push(new ClientWasSynced())
  }
}
