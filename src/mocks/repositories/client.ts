import { Client } from '#domain/entities/client'
import type { IClientRepository } from '#domain/repositories/client'

export class MockClientRepository implements IClientRepository {
  get(): AsyncResult<Client> {
    throw new Error('Method not implemented.')
  }
  sync(_client: Client): Promise<UnsafeTask> {
    throw new Error('Method not implemented.')
  }
}
