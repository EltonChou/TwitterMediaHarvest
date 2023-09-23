import type { User } from '@sentry/browser'
import Browser from 'webextension-polyfill'

export const enum Action {
  Download,
  Refresh,
  FetchUser,
  CheckDownloadHistory,
  ExportHistory,
  ImportHistory,
}

type DownloadExchange = {
  action: Action.Download
  data: TweetInfo
}

type CheckDownloadHistoryExchange = {
  action: Action.CheckDownloadHistory
  data: string
}

type CheckDownloadHistoryResponse = {
  status: 'success'
  data: boolean
}

type FetchUserResponse = {
  status: 'success'
  data: User
}

type ImportHistoryExchange = {
  action: Action.ImportHistory
  data: string
}

export type HarvestExchange<T extends Action> = T extends Action.Download
  ? DownloadExchange
  : T extends Action.CheckDownloadHistory
  ? CheckDownloadHistoryExchange
  : T extends Action.ImportHistory
  ? ImportHistoryExchange
  : {
      action: T
    }

export type HarvestResponse<T extends Action> =
  | (T extends Action.FetchUser
      ? FetchUserResponse
      : T extends Action.CheckDownloadHistory
      ? CheckDownloadHistoryResponse
      : {
          status: 'success'
        })
  | { status: 'error'; error?: string | Error }

export type HandleExchange<T extends Action> = (
  exchange: HarvestExchange<T>
) => Promise<HarvestResponse<T>>

export const exchangeInternal = async <T extends Action>(
  exchange: HarvestExchange<T>
): Promise<HarvestResponse<T>> => {
  return Browser.runtime.sendMessage(exchange)
}
