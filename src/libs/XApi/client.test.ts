/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { ApiClient } from './client'
import type { CacheAbleCommand } from './commands/types'

describe('ApiClient.exec', () => {
  afterEach(() => jest.restoreAllMocks())

  it('keeps the fetched output when writing to the cache fails', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValue(new Response('{}'))
    const consoleError = jest.spyOn(console, 'error').mockImplementation()

    const putError = new Error('Entry already exists.')
    const output = { $metadata: { httpStatusCode: 200 }, tweetResult: {} }
    const command = {
      isCacheAble: true,
      prepareRequest: async () => new Request('https://x.com/graphql'),
      readFromCache: async () => undefined,
      putIntoCache: jest.fn().mockRejectedValue(putError),
      resolveResponse: async () => output,
    } as unknown as CacheAbleCommand<never, never>

    const result = await new ApiClient().exec(command)

    expect(command.putIntoCache).toHaveBeenCalledTimes(1)
    expect(result.error).toBeUndefined()
    expect(result.value).toEqual(output)
    expect(consoleError).toHaveBeenCalledWith(putError)
  })
})
