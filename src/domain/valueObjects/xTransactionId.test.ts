import { isErrorResult, isSuccessResult } from '#utils/result'
import { propsExtractor } from '#utils/valuObject'
import { XTransactionId } from './xTransactionId'

describe('XTransactionId', () => {
  describe('create', () => {
    it('should create an XTransactionId with valid props', () => {
      const props = {
        method: 'GET',
        value: '123456',
        path: '/api/endpoint',
      }

      const result = XTransactionId.create(props)

      expect(isSuccessResult(result)).toBeTrue()
      if (isSuccessResult(result)) {
        const { capturedAt } = result.value.mapBy(propsExtractor('capturedAt'))
        expect(result.value).toBeInstanceOf(XTransactionId)
        expect(capturedAt).toBeInstanceOf(Date)
      }
    })

    it('should return error when path does not match endpoint pattern', () => {
      const props = {
        method: 'GET',
        value: '123456',
        path: 'invalid-path',
      }

      const result = XTransactionId.create(props)

      expect(isErrorResult(result)).toBeTrue()
      if (isErrorResult(result)) {
        expect(result.error.message).toBe(
          'Cannot parse endpoint from given path: `invalid-path`'
        )
      }
    })
  })
})
