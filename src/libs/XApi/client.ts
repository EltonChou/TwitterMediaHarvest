/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { toErrorResult, toSuccessResult } from '#utils/result'
import type {
  FetchTweetCommandInput,
  FetchTweetCommandOutput,
} from './commands'
import type { CacheAbleCommand, Command } from './commands/types'
import type { Client, ClientConfiguration } from './types'

type CommandInputs = FetchTweetCommandInput
type CommandOutputs = FetchTweetCommandOutput

export class ApiClient implements Client<CommandInputs, CommandOutputs> {
  constructor(readonly config?: ClientConfiguration) {}

  static with(config: ClientConfiguration) {
    return new ApiClient(config)
  }

  makeCacheResult<OutputType extends CommandOutputs>(
    output: OutputType
  ): Result<OutputType> {
    return toSuccessResult({
      ...output,
      $metadata: {
        ...output.$metadata,
        remainingQuota: 'omit',
        quotaResetTime: 'omit',
      },
    })
  }

  async exec<
    InputType extends CommandInputs,
    OutputType extends CommandOutputs,
  >(
    command:
      | Command<InputType, OutputType>
      | CacheAbleCommand<InputType, OutputType>
  ): AsyncResult<OutputType> {
    try {
      const request = await command.prepareRequest({
        protocol: 'https',
        hostname: 'x.com',
      })

      if (this.config?.cookieStore)
        request.headers.set(
          'cookie',
          await this.config.cookieStore.get('x.com')
        )

      const cachedResponse = isCacheAbleCommand(command)
        ? await command.readFromCache(request)
        : undefined
      const isCachedResponse =
        isCacheAbleCommand(command) && cachedResponse !== undefined

      const response =
        cachedResponse ??
        (await fetch(request, {
          signal: AbortSignal.timeout(
            this.config?.timeout ? Math.abs(this.config.timeout) : 10000
          ),
        }))

      /**
       * Preserve the response to prevent it consumed by command
       * and prevent clone when the response is from cache.
       */
      const clonedResponse = isCachedResponse ? response : response.clone()
      const output = await command.resolveResponse(response)
      const shouldCache =
        isCacheAbleCommand(command) &&
        cachedResponse === undefined &&
        output.$metadata.httpStatusCode === 200

      if (shouldCache)
        await command.putIntoCache(request.clone(), clonedResponse)

      if (!isCachedResponse && this.config?.cookieStore) {
        const cookies = response.headers.get('set-cookie')
        if (cookies) await this.config.cookieStore.set('x.com', cookies)
      }

      return isCachedResponse
        ? this.makeCacheResult(output)
        : toSuccessResult(output)
    } catch (error) {
      return toErrorResult(error as Error)
    }
  }
}

const isCacheAbleCommand = <
  InputType extends CommandInputs,
  OutputType extends CommandOutputs,
>(
  command:
    | Command<InputType, OutputType>
    | CacheAbleCommand<InputType, OutputType>
): command is CacheAbleCommand<InputType, OutputType> => command.isCacheAble
