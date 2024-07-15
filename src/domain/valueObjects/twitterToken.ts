import { ValueObject } from './base'

type TwitterTokenProps = {
  name: string
  value: string
}

export class TwitterToken extends ValueObject<TwitterTokenProps> {
  get value() {
    return this.props.value
  }
}
