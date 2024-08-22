import type { Factory } from '#domain/factories/base'
import type { AWSCredential } from '#domain/valueObjects/awcCredential'
import type { CognitoIdentityCredentials } from '@aws-sdk/credential-provider-cognito-identity'

export const AWSCredentailToCognitoIdentityCredentials: Factory<
  AWSCredential,
  CognitoIdentityCredentials
> = credential =>
  credential.mapBy(props => ({
    accessKeyId: props.accessKeyId,
    expiration: props.expiration,
    sessionToken: props.sessionToken,
    identityId: props.identityId,
    secretAccessKey: props.secretAccessKey,
  }))
