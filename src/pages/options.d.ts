type PureAction<T> = {
  type: T
}

type DataActionWithPayload<T> = PureAction<string> & {
  payload: T
}

type DataInitAction<T> = PureAction<'init'> & DataActionWithPayload<T>
