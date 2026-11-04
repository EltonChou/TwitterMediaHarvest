/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { AWSCredentialRepository } from '#infra/repositories/awsCredential'
import { ApiClient as AwsApiClient } from '#libs/AWSClientApi'
import { ApiClient as XApiClient } from '#libs/XApi'
import { getVersion } from '#utils/runtime'
import { AWSCredentailToCognitoIdentityCredentials } from '../mappers/awsCredential'
import { syncWebExtStorage } from './proxy'

const awsCredentialRepo = new AWSCredentialRepository(syncWebExtStorage, {
  identityPoolId: process.env['IDENTITY_POOL_ID'],
  region: process.env['IDENTITY_POOL_REGION'],
})

export const awsClient = new AwsApiClient({
  apiKey: process.env['API_KEY'],
  clientVersion: getVersion(),
  hostName: process.env['API_HOSTNAME'],
  region: 'ap-northeast-1',
  credentials: async () => {
    const credential = await awsCredentialRepo.get()
    return AWSCredentailToCognitoIdentityCredentials(credential)
  },
})

/**
 * Whether this build talks to the Media Harvest backend (client registration
 * and usage sync). Builds made from `sample.env`, such as this fork's Safari
 * build, have a placeholder host and skip it instead of failing requests.
 */
export const isClientApiConfigured = (() => {
  const host = process.env['API_HOSTNAME']
  return Boolean(host && host.includes('.') && URL.canParse(`https://${host}`))
})()

export const xApiClient = new XApiClient({ timeout: 10000 })
