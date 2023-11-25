import type { User } from '@sentry/browser'
import Browser from 'webextension-polyfill'

export const enum Action {
  Download,
  Refresh,
  FetchUser,
  CheckDownloadHistory,
  ExportHistory,
  ImportHistory,
  RetryAll,
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

type GeneralErrorResponse = { status: 'error'; error?: string | Error }

type GeneralSuccessResponse = {
  status: 'success'
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
      : GeneralSuccessResponse)
  | GeneralErrorResponse

export type ExchangeHandler<T extends Action> = (
  exchange: HarvestExchange<T>
) => Promise<HarvestResponse<T>>

export const exchangeInternal = async <T extends Action>(
  exchange: HarvestExchange<T>
): Promise<HarvestResponse<T>> => {
  return Browser.runtime.sendMessage(exchange)
}
