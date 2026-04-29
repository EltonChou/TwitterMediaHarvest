import type {
  IXTransactionIdCache,
  TransactionIdKey,
} from '#domain/repositories/xTransactionId'
import type { XTransactionId } from '#domain/valueObjects/xTransactionId'
import { toErrorResult } from '#utils/result'

export class MockXTransactionIdCache implements IXTransactionIdCache {
  async get(
    _cacheId: TransactionIdKey
  ): AsyncResult<XTransactionId | undefined, Error> {
    return toErrorResult(new Error('Method not implemented.'))
  }

  async save(_item: XTransactionId): Promise<UnsafeTask> {
    return new Error('Method not implemented.')
  }

  async saveAll(..._items: XTransactionId[]): Promise<UnsafeTask> {
    return new Error('Method not implemented.')
  }
}
