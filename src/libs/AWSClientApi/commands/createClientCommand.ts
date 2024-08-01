import { ApiError } from '../errors'
import { BaseCommand } from './baseCommand'
import { HttpMethod, type MetadataBearer, type RequestContext } from './types'
import { streamCollector } from '@smithy/fetch-http-handler'
import { HttpRequest, type HttpResponse } from '@smithy/protocol-http'
import jws from 'jws'

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
      ...context,
    })
  }

  /**
   * @internal
   */
  async resolveResponse(response: HttpResponse): Promise<CreateClientCommandOutput> {
    const body = JSON.parse(
      new TextDecoder().decode(await streamCollector(response.body))
    )

    if (response.statusCode === 201) {
      const signature = jws.decode(body.token, { json: true })
      if (!signature)
        throw new ApiError('Failed to decode response body.', {
          requestId: response.headers['x-amzn-requestid'],
          statusCode: response.statusCode,
        })

      return {
        $metadata: {
          httpStatusCode: response.statusCode,
          requestId: response.headers['x-amzn-requestid'],
        },
        syncToken: body.token,
        clientUUID: signature.payload['uuid'],
        uninstallCode: body.uninstallCode || signature.payload['uninstallCode'],
      }
    }

    throw new ApiError('Failed to request.', {
      requestId: response.headers['x-amzn-requestid'],
      statusCode: response.statusCode,
    })
  }
}
