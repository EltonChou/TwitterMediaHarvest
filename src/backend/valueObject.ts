export default abstract class ValueObject<Props> {
  protected constructor(protected props: Props) {}
}
