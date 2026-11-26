import { emitStorageChange } from '#mocks/storageOnChanged'
import { createSettingsStore } from './SettingsStore'
import { storage } from 'webextension-polyfill'

type Settings = { foo: boolean; bar: number }

const defaults: Settings = { foo: false, bar: 0 }

const flushPromises = () => new Promise(resolve => setTimeout(resolve))

const makeStore = (get: () => Promise<Settings>) =>
  createSettingsStore({
    get,
    getDefault: () => ({ ...defaults }),
    keys: new Set(Object.keys(defaults)),
  })

describe('unit test for SettingsStore', () => {
  beforeEach(() => {
    jest.mocked(storage.onChanged.addListener).mockClear()
    jest.mocked(storage.onChanged.removeListener).mockClear()
  })

  it('should provide a stable default snapshot before loading', () => {
    const store = makeStore(jest.fn().mockResolvedValue({ foo: true, bar: 1 }))

    expect(store.getSnapShot()).toStrictEqual(defaults)
    expect(store.getSnapShot()).toBe(store.getSnapShot())
    expect(store.getIsLoaded()).toBeFalse()
  })

  it('should load settings and listen to storage on first subscription', async () => {
    const loaded = { foo: true, bar: 1 }
    const get = jest.fn().mockResolvedValue(loaded)
    const store = makeStore(get)
    const onChange = jest.fn()

    const unsubscribe = store.subscribe(onChange)
    await flushPromises()

    expect(storage.onChanged.addListener).toHaveBeenCalledTimes(1)
    expect(get).toHaveBeenCalledTimes(1)
    expect(onChange).toHaveBeenCalled()
    expect(store.getSnapShot()).toBe(loaded)
    expect(store.getSnapShot()).toBe(store.getSnapShot())
    expect(store.getIsLoaded()).toBeTrue()

    unsubscribe()
  })

  it('should listen to storage only once for multiple subscribers', () => {
    const store = makeStore(jest.fn().mockResolvedValue(defaults))

    const unsubscribeA = store.subscribe(jest.fn())
    const unsubscribeB = store.subscribe(jest.fn())
    expect(storage.onChanged.addListener).toHaveBeenCalledTimes(1)

    unsubscribeA()
    expect(storage.onChanged.removeListener).not.toHaveBeenCalled()

    unsubscribeB()
    expect(storage.onChanged.removeListener).toHaveBeenCalledWith(
      jest.mocked(storage.onChanged.addListener).mock.lastCall![0]
    )
  })

  it.each([
    { name: 'related key foo', key: 'foo', refreshes: true },
    { name: 'related key bar', key: 'bar', refreshes: true },
    { name: 'unrelated key', key: 'someOtherKey', refreshes: false },
  ])(
    'should refresh on storage change of $name: $refreshes',
    async ({ key, refreshes }) => {
      const get = jest.fn().mockResolvedValue(defaults)
      const store = makeStore(get)
      const unsubscribe = store.subscribe(jest.fn())
      await flushPromises()
      get.mockClear()

      emitStorageChange({ [key]: { newValue: 1, oldValue: 0 } })

      expect(get).toHaveBeenCalledTimes(refreshes ? 1 : 0)
      unsubscribe()
    }
  )

  it('should update snapshot and notify when storage changes', async () => {
    const get = jest.fn().mockResolvedValue(defaults)
    const store = makeStore(get)
    const onChange = jest.fn()
    const unsubscribe = store.subscribe(onChange)
    await flushPromises()
    onChange.mockClear()

    const changed = { foo: true, bar: 0 }
    get.mockResolvedValue(changed)
    emitStorageChange({ foo: { newValue: true, oldValue: false } })
    await flushPromises()

    expect(onChange).toHaveBeenCalled()
    expect(store.getSnapShot()).toBe(changed)
    unsubscribe()
  })

  it('should ignore a stale load that resolves after a newer one', async () => {
    let resolveInitial: (value: Settings) => void = () => undefined
    const get = jest
      .fn<Promise<Settings>, []>()
      .mockReturnValueOnce(new Promise(resolve => (resolveInitial = resolve)))
    const store = makeStore(get)
    const unsubscribe = store.subscribe(jest.fn())

    const latest = { foo: true, bar: 2 }
    get.mockResolvedValueOnce(latest)
    emitStorageChange({ foo: { newValue: true, oldValue: false } })
    await flushPromises()

    resolveInitial({ foo: false, bar: 1 })
    await flushPromises()

    expect(store.getSnapShot()).toBe(latest)
    unsubscribe()
  })

  it('should resolve a superseded refresh only after the newer load applies', async () => {
    let resolveFirst: (value: Settings) => void = () => undefined
    let resolveSecond: (value: Settings) => void = () => undefined
    const get = jest
      .fn<Promise<Settings>, []>()
      .mockReturnValueOnce(new Promise(resolve => (resolveFirst = resolve)))
      .mockReturnValueOnce(new Promise(resolve => (resolveSecond = resolve)))
    const store = makeStore(get)

    const onFirstDone = jest.fn()
    store.triggerChange().then(onFirstDone)
    store.triggerChange()

    resolveFirst({ foo: false, bar: 1 })
    await flushPromises()
    expect(onFirstDone).not.toHaveBeenCalled()

    const latest = { foo: true, bar: 2 }
    resolveSecond(latest)
    await flushPromises()
    expect(onFirstDone).toHaveBeenCalled()
    expect(store.getSnapShot()).toBe(latest)
  })

  it('can refresh on demand', async () => {
    const get = jest.fn().mockResolvedValue(defaults)
    const store = makeStore(get)
    const onChange = jest.fn()
    const unsubscribe = store.subscribe(onChange)
    await flushPromises()

    const changed = { foo: true, bar: 3 }
    get.mockResolvedValue(changed)
    await store.triggerChange()

    expect(store.getSnapShot()).toBe(changed)
    unsubscribe()
  })
})
