/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { responseToMetadataBearer } from '../utils/response'
import { BaseCommand } from './baseCommand'
import { CommandResponseError } from './errors'
import { HttpMethod, type MetadataBearer, type RequestContext } from './types'
import { streamCollector } from '@smithy/fetch-http-handler'
import { HttpRequest, type HttpResponse } from '@smithy/protocol-http'
import { jwtDecode } from 'jwt-decode'
import type { JwtPayload } from 'jwt-decode'

interface TokenPayload extends JwtPayload {
  uuid: string
  uninstallCode: string
  trafficUsage: number
  downloadCount: number
}

interface UsageStatistics {
  downloadCount: number
  trafficUsage: number
}

export interface CreateClientCommandInput {
  initStats: UsageStatistics
}
export interface CreateClientCommandOutput extends MetadataBearer {
  clientUUID: string
  syncToken: string
  uninstallCode: string
}

export class CreateClientCommand extends BaseCommand<
  CreateClientCommandInput,
  CreateClientCommandOutput
> {
  constructor(config: CreateClientCommandInput) {
    super(HttpMethod.Post, '/v1/clients', config)
  }

  /**
   * @internal
   */
  prepareRequest(context: RequestContext): HttpRequest {
    return new HttpRequest({
      protocol: context.protocol,
      method: this.method,
      hostname: context.hostname,
      path: this.path,
      headers: {
        ...context.headers,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(this.config.initStats),
    })
  }

  /**
   * @internal
   */
  async resolveResponse(
    response: HttpResponse
  ): Promise<CreateClientCommandOutput> {
    const body = JSON.parse(
      new TextDecoder().decode(await streamCollector(response.body))
    )

    const metadataBearer = responseToMetadataBearer(response)

    if (response.statusCode === 201) {
      try {
        const decodedToken = jwtDecode<TokenPayload>(body.token)
        return {
          ...metadataBearer,
          syncToken: body.token,
          clientUUID: decodedToken['uuid'],
          uninstallCode: body.uninstallCode ?? decodedToken['uninstallCode'],
        }
      } catch (error) {
        let errorMessage: string = body?.error ?? body?.message
        if (error instanceof Error) errorMessage = error.message
        errorMessage ??= 'Failed to decode response body.'

        throw new CommandResponseError(errorMessage, metadataBearer)
      }
    }

    throw new CommandResponseError(
      body?.error ?? body?.message ?? 'Failed to request.',
      metadataBearer
    )
  }
}
