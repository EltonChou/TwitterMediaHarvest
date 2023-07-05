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

type TwitterApiVersion = 'v1' | 'gql'

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

type DownloadRecordId = `dl_${number}`

interface DownloadRecord {
  tweetInfo: TweetInfo
  config: Downloads.DownloadOptionsType
}

interface StorageSchema {
  [s: string]: unknown
}

interface LocalStorageSchema
  extends StorageSchema,
    FeatureSettings,
    DownloadSettings,
    TwitterApiSettings,
    ClientInfo,
    TwitterApiSettings,
    V4Statistics {
  [downloadRecordKey: DownloadRecordId]: DownloadRecord
}

interface SyncStorageSchema extends StorageSchema, AWSCredentials, V4FilenameSettings {}
