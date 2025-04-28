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
}

declare namespace NodeJS {
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  interface ProcessEnv extends MediaHarvest.Env {}
}

interface CustomEventMap {
  'mh:media-response': CustomEvent<MediaHarvest.MediaResponseDetail>
}

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
interface DocumentEventMap extends CustomEventMap {}
