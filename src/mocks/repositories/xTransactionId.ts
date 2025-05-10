import type { IXTransactionIdRepository } from '#domain/repositories/xTransactionId'
import type { XTransactionId } from '#domain/valueObjects/xTransactionId'

export class MockXTransactionIdRepository implements IXTransactionIdRepository {
  get(_endpoint: string): AsyncResult<XTransactionId> {
    throw new Error('Method not implemented.')
  }
  save(_xTransactionId: XTransactionId): Promise<UnsafeTask> {
    throw new Error('Method not implemented.')
  }
}
