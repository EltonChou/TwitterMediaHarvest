export default abstract class Entity<Id, Props> {
  protected constructor(readonly id: Id, protected props: Props) {}
}
