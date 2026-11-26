import { type Storage, storage } from 'webextension-polyfill'

type StorageChangedListener = ListenerOf<Storage.Static['onChanged']>

/**
 * Listeners currently attached to `storage.onChanged`.
 *
 * Derived from the recorded `addListener` / `removeListener` calls, so it works
 * even after the mock implementations have been reset.
 */
const activeStorageListeners = (): StorageChangedListener[] => {
  const counts = new Map<StorageChangedListener, number>()
  const count = (l: StorageChangedListener, delta: number) =>
    counts.set(l, (counts.get(l) ?? 0) + delta)

  jest
    .mocked(storage.onChanged.addListener)
    .mock.calls.forEach(([l]) => count(l, 1))
  jest
    .mocked(storage.onChanged.removeListener)
    .mock.calls.forEach(([l]) => count(l, -1))

  return [...counts].filter(([, n]) => n > 0).map(([l]) => l)
}

/**
 * Simulate `storage.onChanged` firing for the given keys.
 */
export const emitStorageChange = (
  changes: Record<string, Storage.StorageChange>,
  areaName = 'local'
) => activeStorageListeners().forEach(l => l(changes, areaName))
