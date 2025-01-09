import { HashStore, getHashStore } from './hashStore'
import crypto from 'crypto'

describe('unit test for hashStore', () => {
  it('can get same store', () => {
    const aStore = getHashStore()
    const bStore = getHashStore()

    aStore.saveContext('ctx')
    expect(bStore.contextHash.has('ctx')).toBeTruthy()
  })

  describe('context', () => {
    const store = new HashStore({ alg: 'sha256' })
    const context = 'kappa'
    const expectedHash = crypto.hash('sha256', context, 'hex').slice(0, 7)

    it('can save context hash', () => {
      const hash = store.saveContext(context)

      expect(hash).toBe(expectedHash)
      expect(store.contextHash.has(context)).toBeTruthy()
    })

    it('can get context hash', () => {
      const hash = store.getContextHash(context)
      expect(hash).toBe(expectedHash)

      const undefinedHash = store.getContextHash('null')
      expect(undefinedHash).toBeUndefined()
    })
  })

  describe('msgId', () => {
    const store = new HashStore({ alg: 'sha256' })
    const msgId = 'kappa'
    const expectedHash = crypto.hash('sha256', msgId, 'hex').slice(0, 10)

    it('can save msgId hash', () => {
      const hash = store.saveMsgId(msgId)
      expect(hash).toBe(expectedHash)
      expect(store.msgIdHash.has(msgId)).toBeTruthy()
    })

    it('can get msgId hash', () => {
      const hash = store.getMsgIdHash(msgId)
      expect(hash).toBe(expectedHash)

      const undefinedHash = store.getMsgIdHash('null')
      expect(undefinedHash).toBeUndefined()
    })
  })
})
