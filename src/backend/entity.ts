export default abstract class Entity<Id, Props> {
  readonly id: Id
  protected props: Props

  protected constructor(id: Id, props: Props) {
    this.id = id
    this.props = props
  }
}
