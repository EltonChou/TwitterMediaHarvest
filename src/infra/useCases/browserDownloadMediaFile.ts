import BrowserDownloadDispatched from '#domain/events/BrowserDownloadDispatched'
import type {
  DownloadMediaFileCommand,
  DownloadMediaFileUseCase,
} from '#domain/useCases/downloadMediaFile'
import { DownloadConfig } from '#domain/valueObjects/downloadConfig'
import type { TweetInfo } from '#domain/valueObjects/tweetInfo'
import { makeBrowserDownloadConfig } from '#helpers/downloadConfig'
import Browser from 'webextension-polyfill'

export class BrowserDownloadMediaFileUseCase implements DownloadMediaFileUseCase {
  private _events: IDomainEvent[]
  readonly askWhereToSave: boolean
  readonly targetTweet: TweetInfo

  constructor(targetTweet: TweetInfo, askWhereToSave: boolean) {
    this.targetTweet = targetTweet
    this.askWhereToSave = askWhereToSave
    this._events = []
  }

  get events() {
    return this._events
  }

  async process(command: DownloadMediaFileCommand): Promise<number> {
    const { url, filename } = command.target.mapBy(props => props)

    const downloadId = await Browser.downloads.download(
      makeBrowserDownloadConfig(url, filename, this.askWhereToSave)
    )

    const event = new BrowserDownloadDispatched({
      id: downloadId,
      config: new DownloadConfig({
        conflictAction: 'overwrite',
        saveAs: this.askWhereToSave,
        filename: filename,
        url: url,
      }),
      tweetInfo: this.targetTweet,
    })
    this._events.push(event)

    return downloadId
  }
}
