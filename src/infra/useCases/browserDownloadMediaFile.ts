import BrowserDownloadDispatched from '#domain/events/BrowserDownloadDispatched'
import InternalErrorHappened from '#domain/events/InternalErrorHappened'
import type {
  DownloadMediaFileCommand,
  DownloadMediaFileUseCase,
} from '#domain/useCases/downloadMediaFile'
import { DownloadConfig } from '#domain/valueObjects/downloadConfig'
import { DownloadTarget } from '#domain/valueObjects/downloadTarget'
import type { TweetInfo } from '#domain/valueObjects/tweetInfo'
import { isFirefox } from '#helpers/runtime'
import Browser from 'webextension-polyfill'

export class BrowserDownloadMediaFileUseCase implements DownloadMediaFileUseCase {
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
      conflictAction: 'overwrite',
      saveAs: this.askWhereToSave,
      ...target.mapBy(props => props),
    })
  }

  async process(command: DownloadMediaFileCommand): Promise<void> {
    const config =
      command.target instanceof DownloadTarget
        ? this.downloadTargetToConfig(command.target)
        : command.target

    const downloadId = await Browser.downloads.download(
      downloadConfigToBrowserDownloadOptions(config)
    )

    // If the download api was failed downloadId would be `undefined` and lastError would be set.
    if (downloadId) {
      const event = new BrowserDownloadDispatched({
        id: downloadId,
        config: config,
        tweetInfo: this.targetTweet,
      })
      this.#events.push(event)
    } else {
      this.#events.push(
        new InternalErrorHappened(
          'Failed to trigger browser download api',
          Browser.runtime.lastError as Error
        )
      )
      this.#ok = false
    }
  }
}

const downloadConfigToBrowserDownloadOptions = (
  config: DownloadConfig
): Browser.Downloads.DownloadOptionsType =>
  config.mapBy(props => ({
    filename: props.filename,
    conflictAction: props.conflictAction,
    url: props.url,
    ...(isFirefox() ? { saveAs: props.saveAs } : {}),
  }))
