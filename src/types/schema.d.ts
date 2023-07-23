import type { CognitoIdentityCredentials } from '@aws-sdk/credential-provider-cognito-identity'
import type { DBSchema } from 'idb'
import type { Downloads } from 'webextension-polyfill'

interface DownloadDBSchema extends DBSchema {
  record: {
    key: number
    value: {
      id: number
    } & DownloadRecord
  }
}

interface V4Statistics {
  downloadCount: number
  trafficUsage: number
}

type TwitterApiVersion = 'v1' | 'v2' | 'gql' | 'gql-f'

interface TwitterApiSettings {
  twitterApiVersion: TwitterApiVersion
}

interface ClientInfo {
  uuid: string
  csrfToken: string
  uninstallCode: string
  syncedAt: number
}

interface DownloadSettings {
  enableAria2: boolean
  aggressiveMode: boolean
  askWhereToSave: boolean
}

interface FeatureSettings {
  autoRevealNsfw: boolean
  includeVideoThumbnail: boolean
  keyboardShortcut: boolean
}

type FilenamePatternToken =
  | '{account}'
  | '{tweetId}'
  | '{serial}'
  | '{hash}'
  | '{date}'
  | '{datetime}'
  | '{tweetDate}'
  | '{tweetDatetime}'
  | '{accountId}'
// | '{timestamp}'
// | '{tweet-timestamp}'

type V4FilenamePattern = FilenamePatternToken[]

interface V4FilenameSettings {
  directory: string
  noSubDirectory: boolean
  filenamePattern: V4FilenamePattern
}

interface AWSCredentials extends Omit<CognitoIdentityCredentials, 'expiration'> {
  expiration: number
}

interface AWSCredentialsItem {
  awsCredential: AWSCredentials
}

interface DownloadRecord {
  tweetInfo: TweetInfo
  config: Downloads.DownloadOptionsType
}

interface LocalStorageSchema
  extends FeatureSettings,
    DownloadSettings,
    TwitterApiSettings,
    ClientInfo,
    TwitterApiSettings,
    V4Statistics {}

interface SyncStorageSchema extends AWSCredentialsItem, V4FilenameSettings {}
