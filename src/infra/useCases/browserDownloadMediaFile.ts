import BrowserDownloadDispatched from '#domain/events/BrowserDownloadDispatched'
import type {
  DownloadMediaFileCommand,
  DownloadMediaFileUseCase,
} from '#domain/useCases/downloadMediaFile'
import { DownloadConfig } from '#domain/valueObjects/downloadConfig'
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

  async process(command: DownloadMediaFileCommand): Promise<void> {
    const { url, filename } = command.target.mapBy(props => props)
    const config = new DownloadConfig({
      conflictAction: 'overwrite',
      filename: filename,
      url: url,
      saveAs: this.askWhereToSave,
    })

    const downloadId = await Browser.downloads.download(
      downloadConfigToBrowserDownloadOptions(config)
    )

    if (downloadId) {
      const event = new BrowserDownloadDispatched({
        id: downloadId,
        config: config,
        tweetInfo: this.targetTweet,
      })
      this.#events.push(event)
    } else {
      // TODO: Handle runtime.lastError
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
