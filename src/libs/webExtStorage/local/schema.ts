import type {
  ClientInfo,
  DownloadSettings,
  FeatureSettings,
  SentryExceptionRecord,
  V4Statistics,
} from '#schema'

export interface LocalStorageSchema
  extends FeatureSettings,
    DownloadSettings,
    ClientInfo,
    V4Statistics,
    SentryExceptionRecord {}
