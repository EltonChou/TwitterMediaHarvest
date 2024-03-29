import { ButtonStatus } from '../enums'
import { captureExceptionIO } from './helper'
import { FailedToParseTweetInfoNotifyUseCase } from '@backend/notifications/notifyUseCases'
import { Action, HarvestExchange, HarvestResponse, exchangeInternal } from '@libs/browser'
import { toError } from 'fp-ts/lib/Either'
import { type IOEither } from 'fp-ts/lib/IOEither'
import * as TE from 'fp-ts/lib/TaskEither'
import { pipe } from 'fp-ts/lib/function'

/**
 * Create HTMLElement from html string.
 *
 * @param htmlString A valid html string.
 */
export const createElementFromHTML = (htmlString: string): HTMLElement => {
  const wrapper = document.createElement('div')
  wrapper.innerHTML = htmlString.trim()
  return wrapper.firstElementChild as HTMLElement
}

const cleanButtonStatus = (button: HTMLElement) => {
  button.classList.remove(
    ButtonStatus.Downloading,
    ButtonStatus.Success,
    ButtonStatus.Error,
    ButtonStatus.Downloaded
  )
  return button
}

const setButtonStatus = (status: ButtonStatus) => (button: HTMLElement) => {
  cleanButtonStatus(button)
  button.classList.add(status)
  return button
}

const isButtonDownloading = (button: HTMLElement) =>
  button.classList.contains('downloading')

const convertHarvestResponseToButtonStatus = <T extends Action>(
  resp: HarvestResponse<T>
) => (resp.status === 'success' ? ButtonStatus.Success : ButtonStatus.Error)

const sendExchange = <A extends Action>(
  exchange: HarvestExchange<A>
): TE.TaskEither<Error, HarvestResponse<A>> =>
  TE.tryCatch(async () => exchangeInternal(exchange), toError)

const notifyInfoParserError = TE.tryCatch(async () => {
  const useCase = new FailedToParseTweetInfoNotifyUseCase()
  return useCase.notify()
}, toError)

type InfoProvider = IOEither<Error, TweetInfo>

const sendDownloadRequest = (infoProvider: InfoProvider) =>
  pipe(
    TE.Do,
    TE.bind('data', () => pipe(infoProvider, TE.fromIOEither)),
    TE.bind('response', exchange =>
      sendExchange({ action: Action.Download, data: exchange.data })
    ),
    TE.tapError(e => pipe(e, captureExceptionIO, TE.fromIO, () => notifyInfoParserError)),
    TE.match(
      () => ButtonStatus.Error,
      ({ response }) => convertHarvestResponseToButtonStatus(response)
    )
  )

const buttonClickHandler =
  <T extends HTMLElement>(infoProvider: IOEither<Error, TweetInfo>) =>
  (button: T) =>
  (e: MouseEvent) => {
    e.stopImmediatePropagation()
    if (!button || isButtonDownloading(button)) return

    setButtonStatus(ButtonStatus.Downloading)(button)
    sendDownloadRequest(infoProvider)().then(status => setButtonStatus(status)(button))
  }

const convertCheckDownloadHistoryResponseToBoolean = (
  resp: HarvestResponse<Action.CheckDownloadHistory>
): boolean => (resp.status === 'error' ? false : resp.data)

const checkTweetHasDownloaded = (infoProvider: InfoProvider) =>
  pipe(
    infoProvider,
    TE.fromIOEither,
    TE.chain(info =>
      sendExchange({ action: Action.CheckDownloadHistory, data: info.tweetId })
    ),
    TE.match(() => false, convertCheckDownloadHistoryResponseToBoolean)
  )

export const makeButtonListener =
  <T extends HTMLElement>(infoProvider: InfoProvider) =>
  (button: T): T => {
    button.addEventListener('click', buttonClickHandler(infoProvider)(button))
    checkTweetHasDownloaded(infoProvider)().then(isDownloaded => {
      isDownloaded ? setButtonStatus(ButtonStatus.Downloaded)(button) : {}
    })

    return button
  }
