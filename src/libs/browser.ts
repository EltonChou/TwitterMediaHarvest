import Browser from 'webextension-polyfill'
import type { User } from '@sentry/browser'

export enum Action {
  Download,
  Refresh,
  FetchUser,
}

export type HarvestExchange<T extends Action> = T extends Action.Download
  ? {
      action: T
      data: TweetInfo
    }
  : {
      action: T
    }

export type HarvestResponse<T extends Action> =
  | (T extends Action.FetchUser
      ? {
          status: 'success'
          data: User
        }
      : {
          status: 'success'
        })
  | { status: 'error'; error: Error }

export type HandleExchange<T extends Action> = (exchange: HarvestExchange<T>) => Promise<HarvestResponse<T>>

export const exchangeInternal = async <T extends Action>(exchange: HarvestExchange<T>): Promise<HarvestResponse<T>> => {
  return await Browser.runtime.sendMessage(exchange)
}
