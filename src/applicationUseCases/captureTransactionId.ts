/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import type { IXTransactionIdRepository } from '#domain/repositories/xTransactionId'
import type { AsyncUseCase } from '#domain/useCases/base'
import { XTransactionId } from '#domain/valueObjects/xTransactionId'

type CaptureTransactionIdCommand = {
  method: string
  path: string
  transactionId: string
}

export interface InfraProvider {
  xTransactionIdRepo: IXTransactionIdRepository
}

export class CaptureTransactionId
  implements AsyncUseCase<CaptureTransactionIdCommand, UnsafeTask>
{
  constructor(readonly infra: InfraProvider) {}

  async process(
    command: CaptureTransactionIdCommand
  ): Promise<UnsafeTask<Error>> {
    const { value: transactionId, error } = XTransactionId.create({
      value: command.transactionId,
      method: command.method,
      path: command.path,
    })
    if (error) return error

    return this.infra.xTransactionIdRepo.save(transactionId)
  }
}
