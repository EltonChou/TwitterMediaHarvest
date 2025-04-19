import { ValueObject } from '../domain/valueObjects/base'
import { propsExtractor } from './valuObject'

describe('propExtractor', () => {
  it('should extract specified properties from an object', () => {
    const testObj = {
      name: 'test',
      age: 25,
      email: 'test@test.com',
    }

    const extract = propsExtractor('name', 'age')
    const result = extract(testObj)

    expect(result).toEqual({
      name: 'test',
      age: 25,
    })
  })

  it('should handle missing properties gracefully', () => {
    const testObj = {
      name: 'test',
    }

    const extract = propsExtractor('name', 'age')
    const result = extract(testObj)

    expect(result).toEqual({
      name: 'test',
    })
  })

  it('should work with ValueObject props', () => {
    class TestVO extends ValueObject<{ value: string }> {}
    const vo = new TestVO({ value: 'test' })

    const testObj = {
      id: 1,
      vo: vo,
    }

    const extract = propsExtractor('vo')
    const result = extract(testObj)

    expect(result).toEqual({
      vo: vo,
    })
  })

  it('should return empty object when no props specified', () => {
    const testObj = {
      name: 'test',
      age: 25,
    }

    const extract = propsExtractor()
    const result = extract(testObj)

    expect(result).toEqual({})
  })

  it('should work with ValueObject mapBy function', () => {
    class TestVO extends ValueObject<{ value: string; num: number }> {}
    const vo = new TestVO({ value: 'test', num: 42 })

    const result = vo.mapBy(propsExtractor('value', 'num'))

    expect(result).toEqual({ value: 'test', num: 42 })
  })
})
