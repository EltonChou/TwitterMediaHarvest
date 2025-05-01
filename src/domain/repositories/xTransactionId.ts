import type { XTransactionId } from '#domain/valueObjects/xTransactionId'

export interface IXTransactionIdRepository {
  get(endpoint: string): AsyncResult<XTransactionId>
  save(xTransactionId: XTransactionId): Promise<UnsafeTask>
}
