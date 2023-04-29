export default abstract class ValueObject<Props> {
  readonly props: Props
  protected constructor(props: Props) {
    this.props = Object.freeze(props)
  }
}
