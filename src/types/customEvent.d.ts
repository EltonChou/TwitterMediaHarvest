declare namespace MediaHarvest {
  interface MediaResponseDetail {
    path: string
    status: number
    body: string
  }

  interface TxIdRequestDetail {
    uuid: string
    path: string
    method: string
  }

  interface TxIdResponseDetail {
    uuid: string
    value: string
  }

  interface MediaHasDownloadedDetail {
    tweetId: string
  }

  interface InjectionEventMap {
    'mh:media-response': CustomEvent<MediaHarvest.MediaResponseDetail>
    'mh:tx-id:request': CustomEvent<MediaHarvest.TxIdRequestDetail>
    'mh:tx-id:response': CustomEvent<MediaHarvest.TxIdResponseDetail>
  }

  interface ContentScriptEventMap {
    'mh:download:has-downloaded': CustomEvent<MediaHarvest.MediaHasDownloadedDetail>
    'mh:download:is-failed': CustomEvent<MediaHarvest.MediaHasDownloadedDetail>
  }
}

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
interface DocumentEventMap extends MediaHarvest.InjectionEventMap {}

interface TypedEventTarget<EventMap extends { [K in keyof EventMap]: Event }> {
  addEventListener<K extends keyof EventMap>(
    type: K,
    listener: (ev: EventMap[K]) => void,
    options?: boolean | AddEventListenerOptions
  ): void
  removeEventListener<K extends keyof EventMap>(
    type: K,
    listener: (ev: EventMap[K]) => void,
    options?: boolean | EventListenerOptions
  ): void
  dispatchEvent(event: Event): boolean
}
