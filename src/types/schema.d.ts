import type PatternToken from '#enums/patternToken'
import type { CognitoIdentityCredentials } from '@aws-sdk/credential-provider-cognito-identity'

type V4Statistics = {
  downloadCount: number
  trafficUsage: number
}

type ClientInfo = {
  uuid: string
  csrfToken: string
  uninstallCode: string
  syncedAt: number
}

type DownloadSettings = {
  enableAria2: boolean
  aggressiveMode: boolean
  askWhereToSave: boolean
}

type FeatureSettings = {
  autoRevealNsfw: boolean
  includeVideoThumbnail: boolean
  keyboardShortcut: boolean
}

type AggregationToken = '{account}'

type V4FilenameSettings = {
  directory: string
  noSubDirectory: boolean
  filenamePattern: PatternToken[]
  fileAggregation: boolean
  groupBy: AggregationToken
}

type AWSCredentials = Omit<CognitoIdentityCredentials, 'expiration'> & {
  expiration: number
}

type AWSCredentialsItem = {
  awsCredential: AWSCredentials
}

type SentryLastException = {
  message: string
  timestamp: number
}

type SentryExceptionRecord = {
  lastException: SentryLastException
}
