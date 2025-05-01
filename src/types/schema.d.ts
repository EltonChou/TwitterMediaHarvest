/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
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

type WarningSettings = {
  ignoreFilenameOverwritten: boolean
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

type SolutionQuota = {
  quota: number
  resetAt: number
  warnedAt?: number
}

type SolutionQuotaCollection<SolutionKey extends string = string> = {
  solutionQuotaCollection: {
    [K in SolutionKey]: SolutionQuota
  }
}

type XTransactionIdItem = {
  method: string
  path: string
  value: string
  capturedAt: number
}

type XTransactionIdCollection = {
  xTransactionIdCollection: { [endpoint: string]: XTransactionIdItem[] }
}
