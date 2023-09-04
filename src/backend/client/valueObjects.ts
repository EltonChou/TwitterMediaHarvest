import ValueObject from '@backend/valueObject'
import type { ClientInfo } from '@schema'

export class ClientInfoVO extends ValueObject<ClientInfo> {
  private syncPeriod: number =
    (process.env.NODE_ENV === 'production' ? 30 : 10) * 60 * 1000

  constructor(info: ClientInfo) {
    super(info)
  }

  get csrfToken(): string {
    return this.props.csrfToken
  }

  get uuid(): string {
    return this.props.uuid
  }

  get needSync(): boolean {
    return Date.now() - this.props.syncedAt >= this.syncPeriod
  }

  get uninstallUrl(): string {
    const url = new URL(
      `${process.env.API_ROOT_PATH}/clients/${this.uuid}/uninstall`,
      `https://${process.env.API_HOSTNAME}`
    )
    url.searchParams.set('uninstallCode', this.props.uninstallCode)
    return url.href
  }
}
