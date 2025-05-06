/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import type { IXTransactionIdRepository } from '#domain/repositories/xTransactionId'
import { XTransactionId } from '#domain/valueObjects/xTransactionId'
import type { IStorageProxy } from '#libs/storageProxy'
import type { XTransactionIdCollection } from '#schema'
import { toErrorResult, toSuccessResult } from '#utils/result'

type XTransactionIdRepoOptions = {
  /** How many transaction id should be reserved for usage per identity. */
  reservedCount: number
}

export class LocalXTransactionIdRepository
  implements IXTransactionIdRepository
{
  constructor(
    readonly storageProxy: IStorageProxy<XTransactionIdCollection>,
    readonly options: XTransactionIdRepoOptions = { reservedCount: 5 }
  ) {}

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

    if (
      xTransactionIdCollection[transactionIdItem.endpoint].length >
      this.options.reservedCount
    )
      xTransactionIdCollection[transactionIdItem.endpoint] =
        xTransactionIdCollection[transactionIdItem.endpoint].slice(
          -this.options.reservedCount
        )

    await this.saveCollection(xTransactionIdCollection)
  }
}
