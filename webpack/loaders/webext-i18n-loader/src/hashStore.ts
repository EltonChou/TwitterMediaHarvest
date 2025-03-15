import crypto from 'crypto'
import { validate } from 'schema-utils'

/**
 * @typedef {Object} HashOptions
 * @property {'sha256' | string} alg
 */
export type HashOptions = {
  alg: 'sha256' | string
}

export class HashStore {
  protected options: HashOptions
  readonly contextHash: Map<string, string>
  readonly msgIdHash: Map<string, string>

  constructor(options: HashOptions) {
    validate(
      {
        type: 'object',
        properties: {
          alg: {
            type: 'string',
          },
        },
        additionalProperties: true,
      },
      options
    )
    this.options = options
    this.contextHash = new Map()
    this.msgIdHash = new Map()
  }

  digsetContext(context: string) {
    return crypto.hash(this.options.alg, context, 'hex').slice(0, 7)
  }

  digsetMsgId(msgId: string) {
    return crypto.hash(this.options.alg, msgId, 'hex').slice(0, 10)
  }

  /**
   * @returns digested hash
   */
  saveContext(context: string) {
    const digestedHash = this.contextHash.get(context)
    if (digestedHash) return digestedHash

    const hash = this.digsetContext(context)
    this.contextHash.set(context, hash)
    return hash
  }

  getContextHash(context: string) {
    return this.contextHash.get(context)
  }

  /**
   * @returns digested hash
   */
  saveMsgId(msgId: string) {
    const digestedHash = this.msgIdHash.get(msgId)
    if (digestedHash) return digestedHash

    const hash = this.digsetMsgId(msgId)
    this.msgIdHash.set(msgId, hash)
    return hash
  }

  getMsgIdHash(msgId: string) {
    return this.msgIdHash.get(msgId)
  }
}

export const getHashStore = (() => {
  let store: HashStore
  return () => (store ??= new HashStore({ alg: 'sha256' }))
})()
