/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import type { IDownloadHistoryRepository } from '#domain/repositories/downloadHistory'
import type { AsyncUseCase } from '#domain/useCases/base'
import { metrics } from '@sentry/browser'

type CheckMediaTweetHasBeenDownloadedCommand = {
  tweetId: string
}

export type InfraProvider = {
  downloadHistoryRepo: IDownloadHistoryRepository
}

/**
 * This use case was used to check the media tweet has been downloaded or not,
 * even if there are some errors occured, it is okay to return false.
 */
export class CheckMediaTweetHasBeenDownloaded implements AsyncUseCase<
  CheckMediaTweetHasBeenDownloadedCommand,
  boolean
> {
  constructor(readonly infra: InfraProvider) {}

  async process(
    command: CheckMediaTweetHasBeenDownloadedCommand
  ): Promise<boolean> {
    if (__METRICS__)
      metrics.count('useCase.checkMediaTweetHasBeenDownloaded.invoked', 1)

    const { value: hasBeenDownloaded, error } =
      await this.infra.downloadHistoryRepo.hasTweetId(command.tweetId)

    if (error) {
      // eslint-disable-next-line no-console
      console.error(error)
      return false
    }
    return hasBeenDownloaded
  }
}
