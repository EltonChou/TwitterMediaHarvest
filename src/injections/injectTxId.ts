/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

export {}

declare global {
  interface Window {
    webpackChunk_twitter_responsive_web: WebPackModuleItem[]
  }
}

type WebpackLoadFunction = (a: unknown, b: unknown, c: unknown) => void
type Module = Record<number | string, WebpackLoadFunction>
type WebPackModuleItem = [[string | number | unknown], Module]
type ESModule<T = unknown> = {
  default: T
  __esModule: true
}
type MakeTransactionId = (path: string, method: string) => Promise<string>

let generateTransactionId: MakeTransactionId | undefined = undefined

const enum MediaHarvestEvent {
  ResponseTransactionId = 'mh:tx-id:response',
  RequestTransactionId = 'mh:tx-id:request',
}

self.webpackChunk_twitter_responsive_web = new Proxy<
  Window['webpackChunk_twitter_responsive_web']
>([], {
  get: function (target, prop, receiver) {
    return prop === 'push'
      ? arrayPushProxy(target.push.bind(target))
      : Reflect.get(target, prop, receiver)
  },
})

function arrayPushProxy<T>(arrayPush: Array<T>['push']) {
  return new Proxy(arrayPush, {
    apply(method, thisArg, args: WebPackModuleItem[]) {
      return Reflect.apply(
        method,
        thisArg,
        args.map(item => {
          const [[name], module] = item
          if (typeof name !== 'string' || !isModule(module)) return item
          return typeof name === 'string' && name.includes('ondemand.s')
            ? [[name], moduleProxy(module)]
            : item
        })
      )
    },
  })
}

function moduleProxy(module: Module) {
  return new Proxy(module, {
    get(target, prop, receiver) {
      return typeof prop === 'symbol'
        ? Reflect.get(target, prop, receiver)
        : webpackLoaderFunctionProxy(target[prop])
    },
  })
}

function esModuleProxy(esModule: Partial<ESModule>) {
  return new Proxy(esModule, {
    defineProperty(target, property, attributes) {
      if (property === 'default')
        return Reflect.defineProperty(target, property, {
          ...attributes,
          configurable: true,
        })

      return Reflect.defineProperty(target, property, attributes)
    },
  })
}

function webpackLoaderFunctionProxy(loaderFunc: WebpackLoadFunction) {
  return new Proxy(loaderFunc, {
    apply(
      exportItem,
      thisArg,
      args: [object, Partial<ESModule>, CallableFunction]
    ) {
      const [_, esModule, loader] = args
      const returnVal = Reflect.apply(exportItem, thisArg, [
        _,
        esModuleProxy(esModule),
        loader,
      ])

      if (
        isESModule(esModule) &&
        isCallableFunction<() => MakeTransactionId>(esModule.default, 0)
      ) {
        const txIdGenerator = esModule.default()
        if (!isCallableFunction<MakeTransactionId>(txIdGenerator, 2))
          return returnVal
        generateTransactionId ||= txIdGenerator
        Object.defineProperty(esModule, 'default', {
          configurable: true,
          enumerable: true,
          get: () => () => txIdGenerator,
        })
      }

      return returnVal
    },
  })
}

/**
 * Weak assertion to check if the value is a module object.
 * This is not a strict check and may produce false positives,
 * but it is sufficient for our use case since we are only interested in objects that are likely to be modules.
 *
 * @param value
 * @returns value is {@link Module}
 */
function isModule(value: unknown): value is Module {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/**
 * Weak assertion to check if the value is an ESModule.
 * This is not a strict check and may produce false positives,
 * but it is sufficient for our use case since we are only interested in objects that are likely to be ESModules.
 *
 * @param value
 * @returns value is {@link ESModule}
 */
function isESModule(value: unknown): value is ESModule {
  return (
    typeof value === 'object' &&
    value !== null &&
    '__esModule' in value &&
    value.__esModule === true
  )
}

function isCallableFunction<T extends (...args: never[]) => unknown>(
  value: unknown,
  expectedArity?: number
): value is T {
  return (
    typeof value === 'function' &&
    (expectedArity === undefined || value.length === expectedArity)
  )
}

document.addEventListener('mh:tx-id:request', async e => {
  if (generateTransactionId === undefined) return

  const { path, method, uuid } = e.detail
  const txId = await generateTransactionId(path, method)

  document.dispatchEvent(
    new CustomEvent<MediaHarvest.TxIdResponseDetail>(
      MediaHarvestEvent.ResponseTransactionId,
      {
        detail: {
          uuid,
          value: txId,
        },
      }
    )
  )
})
