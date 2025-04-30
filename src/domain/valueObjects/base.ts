/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
export interface IValueObject<Props extends LiteralObject> {
  mapBy<T>(mapFunc: (props: Props) => T): T
  is(that: unknown): boolean
  duplicate(): this
}

export type PropsOf<T> = T extends ValueObject<infer P> ? P : never

export abstract class ValueObject<Props extends LiteralObject>
  implements IValueObject<Props>
{
  protected props: Props
  constructor(props: Props) {
    this.props = Object.freeze(props)
  }

  mapBy<T>(mapFunc: (props: Props) => T): T {
    return mapFunc(this.props)
  }

  is(that: unknown): boolean {
    if (that === null || that === undefined) return false
    if (!(that instanceof ValueObject) || !(that instanceof this.constructor))
      return false

    for (const propKey in this.props) {
      if (!Object.hasOwn(that.props, propKey)) return false

      const thisProp = this.props[propKey]
      const thatProp = that.props[propKey]
      const isSameProp =
        thisProp instanceof ValueObject
          ? thisProp.is(thatProp)
          : Array.isArray(thisProp) && Array.isArray(thatProp)
            ? arrayEquals(thisProp, thatProp)
            : thisProp === thatProp

      if (!isSameProp) return false
    }

    return true
  }

  toJSON() {
    return this.props
  }

  duplicate(): this {
    return Object.assign(Object.create(Object.getPrototypeOf(this)), this)
  }
}

const arrayEquals = (a: unknown[], b: unknown[]) =>
  Array.isArray(a) &&
  Array.isArray(b) &&
  a.length === b.length &&
  a.every((value, index) =>
    value instanceof ValueObject ? value.is(b[index]) : value === b[index]
  )
