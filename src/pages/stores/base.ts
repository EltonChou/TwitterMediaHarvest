export interface IExternalStore<T> {
  getSnapShot(): T
  subscribe(onStoreChange: () => void): () => void
}
