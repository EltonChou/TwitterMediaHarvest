import { IXTransactionIdRepository } from '#domain/repositories/xTransactionId'
import { XTransactionId } from '#domain/valueObjects/xTransactionId'
import type { IStorageProxy } from '#libs/storageProxy'
import type { XTransactionIdCollection } from '#schema'
import { toErrorResult, toSuccessResult } from '#utils/result'

export class LocalXTransactionIdRepository
  implements IXTransactionIdRepository
{
  constructor(readonly storageProxy: IStorageProxy<XTransactionIdCollection>) {}

  private async getCollection() {
    return this.storageProxy.getItemByDefaults({
      xTransactionIdCollection:
        {} as XTransactionIdCollection['xTransactionIdCollection'],
    })
  }

  private async saveCollection(
    collection: XTransactionIdCollection['xTransactionIdCollection']
  ) {
    await this.storageProxy.setItem({ xTransactionIdCollection: collection })
  }

  async get(endpoint: string): AsyncResult<XTransactionId> {
    const { xTransactionIdCollection } = await this.getCollection()

    if (endpoint in xTransactionIdCollection) {
      const transactionIdItem = xTransactionIdCollection[endpoint].shift()
      await this.saveCollection(xTransactionIdCollection)

      if (transactionIdItem)
        return toSuccessResult(
          new XTransactionId({
            ...transactionIdItem,
            capturedAt: new Date(transactionIdItem.capturedAt),
            endpoint,
          })
        )
    }

    return toErrorResult(new Error('No available transaction id'))
  }

  async save(xTransactionId: XTransactionId): Promise<UnsafeTask> {
    const transactionIdItem = xTransactionId.mapBy(props => ({
      ...props,
      capturedAt: props.capturedAt.getTime(),
    }))

    const { xTransactionIdCollection } = await this.getCollection()

    if (transactionIdItem.endpoint in xTransactionIdCollection) {
      xTransactionIdCollection[transactionIdItem.endpoint].push(
        transactionIdItem
      )
    } else {
      xTransactionIdCollection[transactionIdItem.endpoint] = [transactionIdItem]
    }

    if (xTransactionIdCollection[transactionIdItem.endpoint].length > 5)
      xTransactionIdCollection[transactionIdItem.endpoint] =
        xTransactionIdCollection[transactionIdItem.endpoint].slice(-5)

    await this.saveCollection(xTransactionIdCollection)
  }
}
