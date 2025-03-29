import { AWSCredentialRepository } from '#infra/repositories/awsCredential'
import { ApiClient as AwsApiClient } from '#libs/AWSClientApi'
import { ApiClient as XApiClient } from '#libs/XApi'
import { getVersion } from '#utils/runtime'
import { AWSCredentailToCognitoIdentityCredentials } from '../mappers/awsCredential'
import { syncWebExtStorage } from './proxy'

const awsCredentialRepo = new AWSCredentialRepository(syncWebExtStorage, {
  identityPoolId: process.env['IDENTITY_POOL_ID'] as string,
  region: process.env['IDENTITY_POOL_REGION'] as string,
})

export const awsClient = new AwsApiClient({
  apiKey: process.env['API_KEY'] as string,
  clientVersion: getVersion(),
  hostName: process.env['API_HOSTNAME'] as string,
  region: 'ap-northeast-1',
  credentials: async () => {
    const credential = await awsCredentialRepo.get()
    return AWSCredentailToCognitoIdentityCredentials(credential)
  },
})

export const xApiClient = new XApiClient({ timeout: 10000 })
