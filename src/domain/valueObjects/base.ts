export interface IValueObject<Props extends LiteraObject> {
  mapBy<T>(mapFunc: (props: Props) => T): T
  is(that: unknown): boolean
}

export abstract class ValueObject<Props extends LiteraObject>
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

    if (Object.keys(this.props).length !== Object.keys(that.props).length) return false

    for (const propKey in this.props) {
      if (!Object.hasOwn(that.props, propKey)) return false

      const thisProp = this.props[propKey]
      const thatProp = that.props[propKey]
      const isSameProp =
        thisProp instanceof ValueObject ? thisProp.is(thatProp) : thisProp === thatProp
      if (!isSameProp) return false
    }

    return true
  }
}
