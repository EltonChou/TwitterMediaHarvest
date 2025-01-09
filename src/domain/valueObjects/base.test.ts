import { ValueObject } from '#domain/valueObjects/base'

describe('unit test for value object', () => {
  class Money extends ValueObject<{ currency: string; amount: number }> {}
  class Cup extends ValueObject<{ for: string }> {}
  class Box extends ValueObject<{ items: string[] }> {}
  class CupBox extends ValueObject<{ items: Cup[] }> {}

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

  it('can be serialized', () => {
    const usd = new Money({ currency: 'USD', amount: 1000 })

    expect(JSON.stringify(usd)).toBe(
      JSON.stringify({ currency: 'USD', amount: 1000 })
    )
  })

  it('can duplicate', () => {
    const usd = new Money({ currency: 'USD', amount: 1000 })

    expect(usd.is(usd.duplicate())).toBeTruthy()
  })

  it.each([
    { a: new Box({ items: ['a', 'b'] }) },
    {
      a: new CupBox({
        items: [new Cup({ for: 'water' }), new Cup({ for: 'coke' })],
      }),
    },
  ])('can compare array prop', ({ a }) => {
    const b = a.duplicate()
    expect(a.is(b)).toBeTruthy()
  })
})
