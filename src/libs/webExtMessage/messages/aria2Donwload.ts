import {
  WebExtExternalAction,
  WebExtExternalMessage,
  WebExtMessagePayloadObject,
} from './base'

type Aria2DownloadMessagePayload = {
  url: string
  filename: string
  referrer: string
}

type Aria2DownloadResponsePayload = never

export class Aria2DownloadMessage
  implements
    WebExtExternalMessage<
      WebExtExternalAction.Aria2Download,
      Aria2DownloadMessagePayload,
      Aria2DownloadResponsePayload
    >
{
  constructor(readonly payload: Aria2DownloadMessagePayload) {}
  toObject(): WebExtMessagePayloadObject<
    WebExtExternalAction,
    Aria2DownloadMessagePayload
  > {
    return {
      action: WebExtExternalAction.Aria2Download,
      payload: this.payload,
    }
  }
}
