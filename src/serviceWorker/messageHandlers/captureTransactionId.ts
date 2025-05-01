/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { CaptureTransactionIdMessage } from '#libs/webExtMessage'
import { CaptureTransactionId } from '../../applicationUseCases/captureTransactionId'
import type { InfraProvider } from '../../applicationUseCases/captureTransactionId'
import { type MessageContextHandler, makeErrorResponse } from '../messageRouter'

const captureTransactionIdHandler = (
  infra: InfraProvider
): MessageContextHandler => {
  const useCase = new CaptureTransactionId(infra)

  return async ctx => {
    const { value: message, error: schemaError } =
      CaptureTransactionIdMessage.validate(ctx.message)
    if (schemaError) return ctx.response(makeErrorResponse(schemaError.message))

    const error = await useCase.process(message.payload)

    return ctx.response(
      error
        ? message.makeResponse(false, error.message)
        : message.makeResponse(true)
    )
  }
}

export default captureTransactionIdHandler
