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
import { ConvertMp4ToGifMessage, sendTabMessage } from '#libs/webExtMessage'
import { downloadConfigToBrowserDownloadOptions } from '#mappers/downloadConfig'
import { downloads, runtime, tabs } from 'webextension-polyfill'

/** Pages running our content script, which can convert mp4 to gif. */
const X_TAB_URL_PATTERNS = [
  '*://twitter.com/*',
  '*://mobile.twitter.com/*',
  '*://tweetdeck.twitter.com/*',
  '*://x.com/*',
]

const KEEP_ALIVE_INTERVAL_MS = 20_000

/**
 * The MV3 service worker is killed after 30 seconds of inactivity, which a
 * long-running conversion in a tab would otherwise look like. Calling a
 * trivial extension api periodically resets the idle timer.
 */
const keepWorkerAliveDuring = async <T>(task: Promise<T>): Promise<T> => {
  const keepAlive = setInterval(
    () => runtime.getPlatformInfo().catch(() => undefined),
    KEEP_ALIVE_INTERVAL_MS
  )

  try {
    return await task
  } finally {
    clearInterval(keepAlive)
  }
}

export class BrowserDownloadMediaFile implements DownloadMediaFileUseCase {
  #ok: boolean
  #events: IDomainEvent[]

  readonly askWhereToSave: boolean
  readonly targetTweet: TweetInfo
  readonly tabId?: number

  constructor(targetTweet: TweetInfo, askWhereToSave: boolean, tabId?: number) {
    this.targetTweet = targetTweet
    this.askWhereToSave = askWhereToSave
    this.tabId = tabId
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

  private async resolveConvertibleTabId(): Promise<number | undefined> {
    if (this.tabId !== undefined) return this.tabId

    try {
      const xTabs = await tabs.query({ url: X_TAB_URL_PATTERNS })
      return (xTabs.find(tab => tab.active) ?? xTabs[0])?.id
    } catch {
      return undefined
    }
  }

  /**
   * The downloads api saves whatever bytes the source url serves, while gif
   * sources are mp4 files, so the media has to be converted by a content
   * script (which has DOM access) before downloading. When no tab can
   * convert, fall back to the original media with a matching extension.
   */
  private async prepareGifDownload(config: DownloadConfig): Promise<{
    config: DownloadConfig
    urlToDownload: string
  }> {
    const url = config.mapBy(props => props.url)

    const convertibleTabId = await this.resolveConvertibleTabId()
    if (convertibleTabId !== undefined) {
      try {
        const response = await keepWorkerAliveDuring(
          sendTabMessage(convertibleTabId)(new ConvertMp4ToGifMessage({ url }))
        )
        if (response.status === 'ok')
          return { config, urlToDownload: response.payload.dataUrl }
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('Failed to convert MP4 to GIF via content script', error)
      }
    }

    return {
      config: config.mapBy(
        props =>
          new DownloadConfig({
            ...props,
            filename: props.filename.replace(/\.gif$/, '.mp4'),
          })
      ),
      urlToDownload: url,
    }
  }

  /**
   * @fires BrowserDownloadDispatched - When the download operation is dispatched successfully.
   * @fires BrowserDownloadFailed - When the download operation is failed.
   */
  async process(command: DownloadMediaFileCommand): Promise<void> {
    let config =
      command.target instanceof DownloadTarget
        ? this.downloadTargetToConfig(command.target)
        : command.target

    let urlToDownload = config.mapBy(props => props.url)

    if (config.mapBy(props => props.filename).endsWith('.gif')) {
      ;({ config, urlToDownload } = await this.prepareGifDownload(config))
    }

    const options = downloadConfigToBrowserDownloadOptions(config)
    options.url = urlToDownload

    const downloadId = await downloads.download(options)

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
