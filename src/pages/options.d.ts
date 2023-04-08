type PureAction<T> = {
  type: T
}

type DataActionWithPayload<T, PT> = {
  type: T
  payload: PT
}

type DataInitAction<T> = DataActionWithPayload<'init', T>
