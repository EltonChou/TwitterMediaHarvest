import { ButtonStatus } from '../../enums';
import { captureExceptionIO } from './helper';
import { FailedToParseTweetInfoNotifyUseCase } from '@backend/notifications/notifyUseCases';
import { Action, HarvestExchange, HarvestResponse, exchangeInternal } from '@libs/browser';
import { toError } from 'fp-ts/lib/Either';
import { type IOEither } from 'fp-ts/lib/IOEither';
import * as TE from 'fp-ts/lib/TaskEither';
import { pipe } from 'fp-ts/lib/function';

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

const setButtonStatus = (status: ButtonStatus) => (button: HTMLElement) => {
  if (!button) return button
  button.classList.remove(
    ButtonStatus.Downloading,
    ButtonStatus.Success,
    ButtonStatus.Error,
    ButtonStatus.Downloaded
  )
  button.classList.add(status)
  return button
}

const isButtonDownloading = (button: HTMLElement) =>
  button.classList.contains('downloading')

const sendExchange = <A extends Action>(
  exchange: HarvestExchange<A>
): TE.TaskEither<Error, HarvestResponse<A>> =>
  TE.tryCatch(async () => exchangeInternal(exchange), toError)

const notifyInfoParserError = TE.tryCatch(async () => {
  const useCase = new FailedToParseTweetInfoNotifyUseCase()
  return await useCase.notify()
}, toError)

export const makeButtonListener =
  <T extends HTMLElement>(infoProvider: IOEither<Error, TweetInfo>) =>
  (button: T): T => {
    button.addEventListener('click', function (e) {
      e.stopImmediatePropagation()
      if (isButtonDownloading(this)) return

      setButtonStatus(ButtonStatus.Downloading)(button)

      pipe(
        TE.Do,
        TE.bind('data', () => pipe(infoProvider, TE.fromIOEither)),
        TE.tapError(e =>
          pipe(e, captureExceptionIO, TE.fromIO, () => notifyInfoParserError)
        ),
        TE.bind('response', exchange =>
          sendExchange({ action: Action.Download, data: exchange.data })
        ),
        TE.match(
          () => ButtonStatus.Error,
          ({ response }) =>
            response.status === 'success' ? ButtonStatus.Success : ButtonStatus.Error
        )
      )().then(status => setButtonStatus(status)(button))
    })

    const checkTweetHasDownloaded = pipe(
      infoProvider,
      TE.fromIOEither,
      TE.chain(info =>
        sendExchange({ action: Action.CheckDownloadHistory, data: info.tweetId })
      ),
      TE.map(resp => (resp.status === 'error' ? false : resp.data)),
      TE.match(
        () => false,
        r => r
      )
    )

    checkTweetHasDownloaded().then(r => {
      r ? setButtonStatus(ButtonStatus.Downloaded)(button) : {}
    })

    return button
  }