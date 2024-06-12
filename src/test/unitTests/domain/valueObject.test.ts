import { ValueObject } from '#domain/valueObjects/base'

describe('unit test for value object', () => {
  class Money extends ValueObject<{ currency: string; amount: number }> {}
  class Cup extends ValueObject<{ for: string }> {}

  it('can compare to other value object', () => {
    const usd = new Money({ currency: 'USD', amount: 1000 })
    const sameUsd = new Money({ currency: 'USD', amount: 1000 })
    const jpy = new Money({ currency: 'JPY', amount: 10000 })
    const cup = new Cup({ for: 'water' })

    expect(usd.is(sameUsd)).toBeTruthy()
    expect(usd.is(jpy)).toBeFalsy()
    expect(usd.is(cup)).toBeFalsy()
    expect(usd.is(undefined)).toBeFalsy()
    expect(usd.is(null)).toBeFalsy()
  })

  it('can be mapped', () => {
    const usd = new Money({ currency: 'USD', amount: 1000 })
    const toClaimString = ({ currency, amount }: Money['props']) =>
      `I have ${amount} ${currency}.`

    expect(usd.mapBy(toClaimString)).toBe('I have 1000 USD.')
  })
})
