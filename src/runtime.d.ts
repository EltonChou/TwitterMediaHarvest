declare namespace MediaHarvest {
  interface Env {
    IDENTITY_POOL_ID: string
    IDENTITY_POOL_REGION: string
    API_KEY: string
    API_HOSTNAME: string
    SENTRY_DSN: string
  }

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
}

declare namespace NodeJS {
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  interface ProcessEnv extends MediaHarvest.Env {}
}

interface CustomEventMap {
  'mh:media-response': CustomEvent<MediaHarvest.MediaResponseDetail>
  'mh:tx-id:request': CustomEvent<MediaHarvest.TxIdRequestDetail>
  'mh:tx-id:response': CustomEvent<MediaHarvest.TxIdResponseDetail>
}

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
interface DocumentEventMap extends CustomEventMap {}
