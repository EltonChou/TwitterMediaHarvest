/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import type { Factory } from '#domain/factories/base'
import type { AWSCredential } from '#domain/valueObjects/awcCredential'
import { propsExtractor } from '#utils/valuObject'
import type { CognitoIdentityCredentials } from '@aws-sdk/credential-provider-cognito-identity'

export const AWSCredentailToCognitoIdentityCredentials: Factory<
  AWSCredential,
  CognitoIdentityCredentials
> = credential =>
  credential.mapBy(
    propsExtractor(
      'accessKeyId',
      'expiration',
      'sessionToken',
      'identityId',
      'secretAccessKey'
    )
  )
