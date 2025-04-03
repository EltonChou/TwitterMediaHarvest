import type {
  ClientInfo,
  DownloadSettings,
  FeatureSettings,
  SentryExceptionRecord,
  SolutionQuotaCollection,
  V4Statistics,
  WarningSettings,
} from '#schema'

export interface LocalStorageSchema
  extends FeatureSettings,
    DownloadSettings,
    ClientInfo,
    V4Statistics,
    SentryExceptionRecord,
    WarningSettings,
    SolutionQuotaCollection {}
