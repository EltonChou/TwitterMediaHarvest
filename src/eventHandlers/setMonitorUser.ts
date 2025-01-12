import { DomainEventHandler } from '#domain/eventPublisher'
import { IClientRepository } from '#domain/repositories/client'
import { setUser } from '#monitor'

export const setMonitorUser =
  (clientRepo: IClientRepository): DomainEventHandler<IDomainEvent> =>
  async _event => {
    const { value: client, error } = await clientRepo.get()
    if (error) return
    setUser({ clientId: client.id.value })
  }
