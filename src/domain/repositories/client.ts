import type { Client } from '#domain/entities/client'

export interface IClientRepository {
  get(): AsyncResult<Client>
  sync(client: Client): Promise<UnsafeTask>
}
