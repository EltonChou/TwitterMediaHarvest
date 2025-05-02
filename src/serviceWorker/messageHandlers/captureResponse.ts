/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { CaptureResponseMessage } from '#libs/webExtMessage'
import { CaptureResponseAndCache } from '../../applicationUseCases/captureResponseAndCache'
import type { InfraProvider } from '../../applicationUseCases/captureResponseAndCache'
import { type MessageContextHandler, makeErrorResponse } from '../messageRouter'

const captureResponseHandler = (
  infra: InfraProvider
): MessageContextHandler => {
  const useCase = new CaptureResponseAndCache(infra)

  return async ctx => {
    const { value: message, error } = CaptureResponseMessage.validate(
      ctx.message
    )
    if (error) return ctx.response(makeErrorResponse(error.message))

    const cacheError = await useCase.process({
      body: message.payload.body,
      type: message.payload.type,
    })

    return cacheError
      ? ctx.response(message.makeResponse(false, 'Not implemented'))
      : ctx.response(message.makeResponse(true))
  }
}

export default captureResponseHandler
