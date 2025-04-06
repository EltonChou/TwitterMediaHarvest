/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { responseToMetadataBearer } from '../utils/response'
import { BaseCommand } from './baseCommand'
import { CommandResponseError } from './errors'
import type { MetadataBearer, RequestContext } from './types'
import { HttpMethod } from './types'
import { streamCollector } from '@smithy/fetch-http-handler'
import { HttpRequest, type HttpResponse } from '@smithy/protocol-http'

interface UsageStatistics {
  downloadCount: number
  trafficUsage: number
}

export interface SyncClientCommandInput {
  syncToken: string
  clientId: string
  stats: UsageStatistics
}

export interface SyncClientCommandOutput extends MetadataBearer {
  syncToken: string
}

export class SyncClientCommand extends BaseCommand<
  SyncClientCommandInput,
  SyncClientCommandOutput
> {
  constructor(config: SyncClientCommandInput) {
    const path = '/v1/clients/' + config.clientId + '/stats'
    super(HttpMethod.Put, path, config)
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
        'x-csrf-token': this.config.syncToken,
      },
      body: JSON.stringify(this.config.stats),
    })
  }

  /**
   * @internal
   */
  async resolveResponse(
    response: HttpResponse
  ): Promise<SyncClientCommandOutput> {
    const body = JSON.parse(
      new TextDecoder().decode(await streamCollector(response.body))
    )

    const metadataBearer = responseToMetadataBearer(response)

    if (response.statusCode === 200)
      return {
        ...metadataBearer,
        syncToken: body.token,
      }

    throw new CommandResponseError(
      body?.error ?? body?.message ?? 'Failed to request.',
      metadataBearer
    )
  }
}
