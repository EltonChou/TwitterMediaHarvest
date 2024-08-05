import type { DomainEventHandler } from '#domain/eventPublisher'
import type { IClientRepository } from '#domain/repositories/client'

export const initClient =
  (
    clientRepo: IClientRepository,
    setUninstallURL: (url: string) => Promise<void>
  ): DomainEventHandler<DomainEventMap['runtime:status:installed']> =>
  async () => {
    const { value: client, error: clientError } = await clientRepo.get()

    // TODO: record error
    if (clientError) return

    await setUninstallURL(client.uninstallUrl)
  }
