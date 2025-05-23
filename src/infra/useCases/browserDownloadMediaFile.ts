/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import BrowserDownloadDispatched from '#domain/events/BrowserDownloadDispatched'
import BrowserDownloadIsFailed from '#domain/events/BrowserDownloadFailed'
import type {
  DownloadMediaFileCommand,
  DownloadMediaFileUseCase,
} from '#domain/useCases/downloadMediaFile'
import { DownloadConfig } from '#domain/valueObjects/downloadConfig'
import { DownloadTarget } from '#domain/valueObjects/downloadTarget'
import type { TweetInfo } from '#domain/valueObjects/tweetInfo'
import ConflictAction from '#enums/ConflictAction'
import { downloadConfigToBrowserDownloadOptions } from '#mappers/downloadConfig'
import { downloads, runtime } from 'webextension-polyfill'

export class BrowserDownloadMediaFile implements DownloadMediaFileUseCase {
  #ok: boolean
  #events: IDomainEvent[]

  readonly askWhereToSave: boolean
  readonly targetTweet: TweetInfo

  constructor(targetTweet: TweetInfo, askWhereToSave: boolean) {
    this.targetTweet = targetTweet
    this.askWhereToSave = askWhereToSave
    this.#events = []
    this.#ok = true
  }

  get isOk() {
    return this.#ok
  }

  get events() {
    return this.#events
  }

  private downloadTargetToConfig(target: DownloadTarget): DownloadConfig {
    return new DownloadConfig({
      conflictAction: ConflictAction.Overwrite,
      saveAs: this.askWhereToSave,
      ...target.mapBy(props => props),
    })
  }

  /**
   * @fires BrowserDownloadDispatched - When the download operation is dispatched successfully.
   * @fires BrowserDownloadFailed - When the download operation is failed.
   */
  async process(command: DownloadMediaFileCommand): Promise<void> {
    const config =
      command.target instanceof DownloadTarget
        ? this.downloadTargetToConfig(command.target)
        : command.target

    const downloadId = await downloads.download(
      downloadConfigToBrowserDownloadOptions(config)
    )

    if (isDownloadFailed(downloadId)) {
      this.#events.push(
        new BrowserDownloadIsFailed({
          reason: (runtime.lastError as Error) ?? 'Failed to download',
          config: config,
          tweetInfo: this.targetTweet,
        })
      )
      this.#ok = false
      return
    }

    this.#events.push(
      new BrowserDownloadDispatched({
        id: downloadId,
        config: config,
        tweetInfo: this.targetTweet,
      })
    )
  }
}

/**
 * If the download api was failed downloadId would be `undefined` and lastError would be set.
 */
const isDownloadFailed = (
  downloadId: number | undefined
): downloadId is undefined => downloadId === undefined
