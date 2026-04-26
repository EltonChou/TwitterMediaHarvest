/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import type { ICache } from '#domain/repositories/cache'
import { XTransactionId } from '#domain/valueObjects/xTransactionId'
import { topicLogger } from '#libs/loggers'
import { RequestTransactionIdMessage } from '#libs/webExtMessage/messages/requestTransactionId'
import { type MessageContextHandler, makeErrorResponse } from '../messageRouter'

export type RequestTransactionIdInfra = {
  xTransactionIdCache: ICache<XTransactionId, [path: string, method: string]>
}

const logger = topicLogger('requestTransactionIdHandler')

/**
 * Handles inbound `request-tx-id` **responses** posted back from the content
 * script through the long-lived port. The service worker never receives
 * tx-id requests — only the content/page script can generate an id — so this
 * handler rejects anything that isn't a response.
 *
 * On a successful response, it constructs an {@link XTransactionId} and saves
 * it to the cache, which unblocks any `get()` call waiting on the same key.
 */
const requestTransactionIdHandler = (
  infra: RequestTransactionIdInfra
): MessageContextHandler => {
  return async ctx => {
    if (!RequestTransactionIdMessage.isResponse(ctx.message)) {
      return ctx.response(
        makeErrorResponse('Expected a request-tx-id response.')
      )
    }

    const { value: response, error } =
      RequestTransactionIdMessage.validateResponse(ctx.message)
    if (error) return ctx.response(makeErrorResponse(error.message))

    if (response.status === 'error') {
      if (__DEV__) logger.debug('received error response', response.reason)
      return
    }

    const { transactionId, method, path } = response.payload
    await infra.xTransactionIdCache.save(
      new XTransactionId({ method, path, value: transactionId })
    )
  }
}

export default requestTransactionIdHandler
