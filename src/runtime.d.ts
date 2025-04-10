declare namespace MediaHarvest {
  interface Env {
    RELEASE: string
    TARGET: string
    IDENTITY_POOL_ID: string
    IDENTITY_POOL_REGION: string
    API_KEY: string
    API_HOSTNAME: string
    SENTRY_DSN: string
    ARIA2_EXT_ID: string
  }
}

declare namespace NodeJS {
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  interface ProcessEnv extends MediaHarvest.Env {}
}
