import type { DomainEventHandler } from '#domain/eventPublisher'
import type { IClientRepository } from '#domain/repositories/client'
import { makeApiUrl } from '#helpers/clientApiUrl'
import Browser from 'webextension-polyfill'

export const initClient =
  (
    clientRepo: IClientRepository
  ): DomainEventHandler<DomainEventMap['runtime:status:installed']> =>
  async () => {
    const { value: client, error: clientError } = await clientRepo.get()

    // TODO: record error
    if (clientError) return

    const url = makeApiUrl(`/v1/clients/${client.id.value}/uninstall`, {
      uninstallCode: client.uninstallCode,
    })

    await Browser.runtime.setUninstallURL(url.href)
  }
