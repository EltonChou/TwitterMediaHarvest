import { DomainEventHandler } from '#domain/eventPublisher'
import { IClientRepository } from '#domain/repositories/client'

/* eslint-disable no-console */
export const showClientInfoInConsole =
  (clientRepo: IClientRepository): DomainEventHandler<IDomainEvent> =>
  async event => {
    const { value: client, error } = await clientRepo.get()
    if (error) return
    console.group('Client Information')
    console.info('Client UUID:', client.id.value)
    console.groupEnd()
  }
