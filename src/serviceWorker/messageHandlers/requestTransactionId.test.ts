/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { XTransactionId } from '#domain/valueObjects/xTransactionId'
import {
  RequestTransactionIdMessage,
  type RequestTransactionIdResponse,
} from '#libs/webExtMessage/messages/requestTransactionId'
import requestTransactionIdHandler from './requestTransactionId'

const makeInfra = () => ({
  xTransactionIdCache: {
    get: jest.fn(),
    save: jest.fn().mockResolvedValue(undefined),
    saveAll: jest.fn().mockResolvedValue(undefined),
  },
})

const makeCtx = (message: unknown) => ({
  message,
  sender: {},
  response: jest.fn(),
})

describe('requestTransactionIdHandler', () => {
  it('saves an XTransactionId to the cache on success response', async () => {
    const infra = makeInfra()
    const response = new RequestTransactionIdMessage({
      path: '/api/endpoint',
      method: 'GET',
    }).makeResponse(true, { transactionId: 'tx-abc' })

    const ctx = makeCtx(response)
    await requestTransactionIdHandler(infra)(ctx)

    expect(infra.xTransactionIdCache.save).toHaveBeenCalledTimes(1)
    const saved = infra.xTransactionIdCache.save.mock.calls[0][0]
    expect(saved).toBeInstanceOf(XTransactionId)
    expect(
      saved.mapBy((p: { method: string; value: string; path: string }) => p)
    ).toEqual({
      method: 'GET',
      path: '/api/endpoint',
      value: 'tx-abc',
    })
    expect(ctx.response).not.toHaveBeenCalled()
  })

  it('ignores error responses without saving', async () => {
    const infra = makeInfra()
    const response = new RequestTransactionIdMessage({
      path: '/api/endpoint',
      method: 'GET',
    }).makeResponse(false, 'something went wrong')

    const ctx = makeCtx(response)
    await requestTransactionIdHandler(infra)(ctx)

    expect(infra.xTransactionIdCache.save).not.toHaveBeenCalled()
    expect(ctx.response).not.toHaveBeenCalled()
  })

  it('rejects non-response messages', async () => {
    const infra = makeInfra()
    const request = new RequestTransactionIdMessage({
      path: '/api/endpoint',
      method: 'GET',
    }).toJSON()

    const ctx = makeCtx(request)
    await requestTransactionIdHandler(infra)(ctx)

    expect(infra.xTransactionIdCache.save).not.toHaveBeenCalled()
    expect(ctx.response).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'error' })
    )
  })

  it('rejects malformed responses', async () => {
    const infra = makeInfra()
    const malformed: RequestTransactionIdResponse = {
      isResponse: true,
      action: 'request-tx-id' as never,
      status: 'ok',
      // missing method/path
      payload: { transactionId: 'x' } as never,
    }

    const ctx = makeCtx(malformed)
    await requestTransactionIdHandler(infra)(ctx)

    expect(infra.xTransactionIdCache.save).not.toHaveBeenCalled()
    expect(ctx.response).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'error' })
    )
  })
})
