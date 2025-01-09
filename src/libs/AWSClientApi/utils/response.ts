import type { MetadataBearer } from '../commands/types'
import type { HttpResponse } from '@smithy/types'

export const responseToMetadataBearer = (
  response: HttpResponse
): MetadataBearer => ({
  $metadata: {
    httpStatusCode: response.statusCode,
    requestId: response.headers['x-amzn-requestid'],
  },
})
