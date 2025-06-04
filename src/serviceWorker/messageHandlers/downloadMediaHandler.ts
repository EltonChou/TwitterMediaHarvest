/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { TransactionIdProvider } from '#domain/useCases/fetchTweetSolution'
import { TweetInfo } from '#domain/valueObjects/tweetInfo'
import { DownloadTweetMediaMessage, sendTabMessage } from '#libs/webExtMessage'
import { RequestTransactionIdMessage } from '#libs/webExtMessage/messages/requestTransactionId'
import { toErrorResult, toSuccessResult } from '#utils/result'
import {
  DownloadTweetMedia,
  type InfraProvider,
} from '../../applicationUseCases/downloadTweetMedia'
import { type MessageContextHandler, makeErrorResponse } from '../messageRouter'
import { Runtime, Tabs } from 'webextension-polyfill'

const isSenderTab = (
  sender: Runtime.MessageSender
): sender is Runtime.MessageSender & { tab: Tabs.Tab } =>
  sender.tab !== undefined

const xUrlPattern = /^https:\/\/(www\.)?x\.com\//

const isXTab = (url: string | undefined): boolean =>
  typeof url === 'string' && xUrlPattern.test(url)

const isTabTransactionIdProvider = (
  tab: Tabs.Tab
): tab is Tabs.Tab & { id: number; url: string } =>
  typeof tab.id === 'number' && isXTab(tab.url)

const tabTransactionIdProvider =
  (tabId: number): TransactionIdProvider =>
  async (path, method) => {
    const response = await sendTabMessage(tabId)(
      new RequestTransactionIdMessage({ path, method })
    )

    return response.status === 'ok'
      ? toSuccessResult(response.payload.transactionId)
      : toErrorResult(new Error('Failed to request transaction id'))
  }

const downloadMessageHandler = (
  infraProvider: InfraProvider
): MessageContextHandler => {
  const downloadTweetMedia = new DownloadTweetMedia(infraProvider)

  return async ctx => {
    const { value: message, error } = DownloadTweetMediaMessage.validate(
      ctx.message
    )
    if (error) return ctx.response(makeErrorResponse(error.message))

    const isOk = await downloadTweetMedia.process({
      tweetInfo: new TweetInfo(message.payload),
      xTransactionIdProvider:
        isSenderTab(ctx.sender) && isTabTransactionIdProvider(ctx.sender.tab)
          ? tabTransactionIdProvider(ctx.sender.tab.id)
          : undefined,
    })

    return ctx.response(
      isOk
        ? message.makeResponse(isOk)
        : message.makeResponse(isOk, 'Failed to complete download task.')
    )
  }
}

export default downloadMessageHandler
