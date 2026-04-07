/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
export {}

declare global {
  interface Window {
    webpackChunk_twitter_responsive_web: WebPackModuleItem[]
    __MEDIAHARVEST__: { generateTransactionId: MakeTransactionId | undefined }
  }
}

type WebpackLoadFunction = (
  a: WebpackIdentifier,
  b: Partial<ESModule>,
  c: CallableFunction
) => void

type Module = Record<number | string, WebpackLoadFunction>
type WebPackModuleItem = [[string | number | unknown], Module, ...unknown[]]
type ESModule<T = unknown> = {
  default: T
  __esModule: true
}
type MakeTransactionId = (path: string, method: string) => Promise<string>
type WebpackIdentifier = {
  id: string | number
  loaded: boolean
  exports: ESModule
}

self.__MEDIAHARVEST__ = {
  generateTransactionId: undefined,
}

const enum MediaHarvestEvent {
  ResponseTransactionId = 'mh:tx-id:response',
  RequestTransactionId = 'mh:tx-id:request',
}

const FILE_PATTERN = /ondemand\.s\.[0-9a-f]+\.js/

function arrayProxy<T>(arr: Array<T>) {
  return new Proxy(arr, {
    get(target, prop, receiver) {
      const retVal = Reflect.get(target, prop, receiver)
      if (prop === 'push') return arrPushProxy(retVal)
      return retVal
    },
  })
}

function arrPushProxy<T>(arrPush: Array<T>['push']) {
  return new Proxy(arrPush, {
    apply(target, thisArg, args) {
      if (
        !document.currentScript ||
        !isSrcScript(document.currentScript) ||
        !FILE_PATTERN.test(document.currentScript.src)
      )
        return Reflect.apply(target, thisArg, args)

      return Reflect.apply(
        target,
        thisArg,
        args.map(item => {
          const [chunkIds, module, ...remains] = item
          if (!Array.isArray(chunkIds)) return item

          const [chunkId] = chunkIds
          return isChunkId(chunkId) && isModule(module)
            ? [chunkIds, moduleProxy(module), ...remains]
            : item
        })
      )
    },
  })
}

function moduleProxy(module: Module) {
  return new Proxy(module, {
    get(target, prop, receiver) {
      const retVal = Reflect.get(target, prop, receiver)
      return typeof prop !== 'symbol' &&
        isCallableFunction<WebpackLoadFunction>(retVal, 3)
        ? webpackLoaderFunctionProxy(retVal)
        : retVal
    },
  })
}

function esModuleProxy(esModule: Partial<ESModule>) {
  return new Proxy(esModule, {
    defineProperty(target, property, attributes) {
      if (property === 'default') {
        const { get: defaultFunc } = attributes
        if (defaultFunc && isCallableFunction(defaultFunc)) {
          Object.defineProperty(attributes, 'get', {
            value: defaultFunctionProxy(defaultFunc),
          })
        }
      }

      return Reflect.defineProperty(target, property, {
        ...attributes,
        configurable: property === 'default',
      })
    },
  })
}

function defaultFunctionProxy(defaultFunc: () => unknown) {
  return new Proxy(defaultFunc, {
    apply(target, thisArg, argArray) {
      const func = Reflect.apply(target, thisArg, argArray)

      if (isCallableFunction<MakeTransactionId>(func, 2)) {
        self.__MEDIAHARVEST__.generateTransactionId ||= func
        return func
      }

      return defaultFunctionProxy(func)
    },
  })
}

function webpackLoaderFunctionProxy(loaderFunc: WebpackLoadFunction) {
  return new Proxy(loaderFunc, {
    apply(
      target,
      thisArg,
      args: [WebpackIdentifier, Partial<ESModule>, CallableFunction]
    ) {
      const [_obj, esModule, loader, ...remains] = args

      return Reflect.apply(target, thisArg, [
        _obj,
        // esModule will be loaded as esModule after applying
        esModuleProxy(esModule),
        loader,
        ...remains,
      ])
    },
  })
}

/**
 * Weak assertion to check if the value is a module object.
 * This is not a strict check and may produce false positives,
 * but it is sufficient for our use case since we are only interested in objects that are likely to be modules.
 *
 * ```js
 * { 2222: (h, j, k) => {} }
 * ```
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
function _isESModule(value: unknown): value is ESModule {
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
  if (self.__MEDIAHARVEST__.generateTransactionId === undefined) return

  const { path, method, uuid } = e.detail
  document.dispatchEvent(
    new CustomEvent<MediaHarvest.TxIdResponseDetail>(
      MediaHarvestEvent.ResponseTransactionId,
      {
        detail: {
          uuid,
          value: await self.__MEDIAHARVEST__.generateTransactionId(
            path,
            method
          ),
        },
      }
    )
  )
})

type ChunkId = string | number

/**
 * Return true if chunkId is valid.
 */
function isChunkId(chunkId: unknown): chunkId is ChunkId {
  return (
    chunkId !== undefined &&
    chunkId !== null &&
    chunkId !== '' &&
    (typeof chunkId === 'string' || typeof chunkId === 'number')
  )
}

/**
 * Return true if script is HTMLScriptElement.
 */
function isSrcScript(
  script: HTMLOrSVGScriptElement
): script is HTMLScriptElement {
  return 'src' in script && typeof script['src'] === 'string'
}

function isSafeToPatch<T>(
  patchTarget: Array<T> | unknown
): patchTarget is Array<T> | undefined {
  return patchTarget === undefined || Array.isArray(patchTarget)
}

if (isSafeToPatch(self.webpackChunk_twitter_responsive_web)) {
  self.webpackChunk_twitter_responsive_web = arrayProxy(
    self.webpackChunk_twitter_responsive_web || []
  )
}
