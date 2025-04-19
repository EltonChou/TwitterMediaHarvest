export const propsExtractor = <
  Props extends LiteralObject,
  PropKey extends keyof Props,
>(
  ...props: PropKey[]
): ((obj: Props) => Pick<Props, PropKey>) => {
  return (obj: Props) => {
    const result: Partial<Props> = {}
    for (const prop of props) {
      if (Object.hasOwn(obj, prop)) {
        result[prop] = obj[prop]
      }
    }
    return result as Pick<Props, PropKey>
  }
}
