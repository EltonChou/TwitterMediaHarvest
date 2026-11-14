export interface ObserverOptions {
  readonly autoRevealNsfw: boolean
}

export interface IHarvestObserver {
  initialize(): void
  observe(): void
}

export interface ObserverConstructor {
  new (options: ObserverOptions): IHarvestObserver
}
