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
}

interface CustomEventMap {
  'mh:media-response': CustomEvent<MediaHarvest.MediaResponseDetail>
  'mh:tx-id:request': CustomEvent<MediaHarvest.TxIdRequestDetail>
  'mh:tx-id:response': CustomEvent<MediaHarvest.TxIdResponseDetail>
  'mh:download:has-downloaded': CustomEvent<MediaHarvest.MediaHasDownloadedDetail>
  'mh:download:is-failed': CustomEvent<MediaHarvest.MediaHasDownloadedDetail>
}

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
interface DocumentEventMap extends CustomEventMap {}
